import { z } from 'zod';
import { db, conversations, conversationMessages } from '@/db';
import { eq, asc } from 'drizzle-orm';
import { aiGateway } from '@/ai/gateway';
import { buildSystemPrompt } from '@/config/subjects';
import type { TutorMode } from '@/config/subjects';
import type { KnowledgeChunk, AIMessage } from '@/ai/types';

// ── Structured response schema ────────────────────────────────────────────────

export const TutorStepSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  content: z.string().min(1),
});

export const TutorMisconceptionSchema = z.object({
  misconception: z.string().min(1),
  correction: z.string().min(1),
});

export const TutorStructuredResponseSchema = z.object({
  explanation: z.string().min(1),
  steps: z.array(TutorStepSchema).min(1),
  hints: z.array(z.string()).min(1).max(5),
  misconceptions: z.array(TutorMisconceptionSchema).optional().default([]),
  socraticQuestion: z.string().optional(),
});

export type TutorStructuredResponse = z.infer<typeof TutorStructuredResponseSchema>;

export interface TutorQuestion {
  text: string;
  imageUrls?: string[];
  userId: string;
  subjectId?: string;
  conversationId?: string;
  mode?: TutorMode;
  topic?: string;
  subtopic?: string;
}

export interface TutorFullResponse {
  structured: TutorStructuredResponse;
  conversationId: string;
  messageId: string;
  sourceChunks: Array<{ id: string; text: string; source: string }>;
  rawText: string;
}

const MAX_HISTORY_MESSAGES = 6;

export class TutorService {
  static async answerQuestion(
    question: TutorQuestion,
    ragContext: KnowledgeChunk[]
  ): Promise<TutorFullResponse> {
    const subjectId = question.subjectId ?? 'physics';
    const systemPrompt = buildSystemPrompt(question.mode);

    await aiGateway.initializeForUser(question.userId);

    const convId = await this.getOrCreateConversation(
      question.userId, question.text, subjectId, question.conversationId
    );

    const history = await this.loadHistory(convId);
    const contextText = this.buildContextFromChunks(ragContext);
    const userMessageContent = this.buildUserPrompt(
      question.text, contextText, question.topic, question.subtopic
    );

    await db.insert(conversationMessages).values({
      conversationId: convId, role: 'user', content: userMessageContent,
    });

    const messages: AIMessage[] = [
      ...history,
      { role: 'user', content: userMessageContent },
    ];

    const aiResponse = await aiGateway.generateResponse({
      messages, systemPrompt, maxTokens: 2048, temperature: 0.7,
    });

    const structured = this.parseStructuredResponse(aiResponse.content);

    const [savedAssistantMsg] = await db
      .insert(conversationMessages)
      .values({ conversationId: convId, role: 'assistant', content: aiResponse.content, structuredData: structured })
      .returning({ id: conversationMessages.id });

    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, convId));

    return {
      structured,
      conversationId: convId,
      messageId: savedAssistantMsg.id,
      rawText: aiResponse.content,
      sourceChunks: ragContext.map((c) => ({ id: c.id, text: c.text.substring(0, 200), source: c.source })),
    };
  }

  static async *streamAnswer(
    question: TutorQuestion,
    ragContext: KnowledgeChunk[]
  ): AsyncGenerator<{ type: 'delta'; text: string } | { type: 'done'; data: TutorFullResponse }> {
    const subjectId = question.subjectId ?? 'physics';
    const systemPrompt = buildSystemPrompt(question.mode);

    await aiGateway.initializeForUser(question.userId);

    const convId = await this.getOrCreateConversation(
      question.userId, question.text, subjectId, question.conversationId
    );

    const history = await this.loadHistory(convId);
    const contextText = this.buildContextFromChunks(ragContext);
    const userMessageContent = this.buildUserPrompt(
      question.text, contextText, question.topic, question.subtopic
    );

    await db.insert(conversationMessages).values({
      conversationId: convId, role: 'user', content: userMessageContent,
    });

    const messages: AIMessage[] = [
      ...history,
      { role: 'user', content: userMessageContent },
    ];

    let fullText = '';

    for await (const chunk of aiGateway.generateStream({
      messages, systemPrompt, maxTokens: 2048, temperature: 0.7,
    })) {
      fullText += chunk.delta;
      yield { type: 'delta', text: chunk.delta };
    }

    const structured = this.parseStructuredResponse(fullText);

    const [savedMsg] = await db
      .insert(conversationMessages)
      .values({ conversationId: convId, role: 'assistant', content: fullText, structuredData: structured })
      .returning({ id: conversationMessages.id });

    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, convId));

    yield {
      type: 'done',
      data: {
        structured,
        conversationId: convId,
        messageId: savedMsg.id,
        rawText: fullText,
        sourceChunks: ragContext.map((c) => ({ id: c.id, text: c.text.substring(0, 200), source: c.source })),
      },
    };
  }

  static async generateHint(
    questionText: string,
    previousExplanation: string,
    ragContext: KnowledgeChunk[],
    userId: string = ''
  ): Promise<string> {
    if (userId) await aiGateway.initializeForUser(userId);

    const hintPrompt = `שאלה מקורית: ${questionText}\n\nההסבר הקודם:\n${previousExplanation}\n\nתן רמז קצר אחד (משפט-שניים) שמוביל לחשיבה עצמאית. לא לתת תשובה. עברית בלבד.`;

    const response = await aiGateway.generateResponse({
      messages: [{ role: 'user', content: hintPrompt }],
      systemPrompt: buildSystemPrompt('concept'),
      maxTokens: 300,
      temperature: 0.6,
    });

    return response.content;
  }

  private static async getOrCreateConversation(
    userId: string, questionText: string, subjectId: string, existingConvId?: string
  ): Promise<string> {
    if (existingConvId) {
      const existing = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.id, existingConvId))
        .limit(1);
      if (existing.length > 0) return existingConvId;
    }

    const title = questionText.length > 80 ? questionText.substring(0, 77) + '...' : questionText;
    const [conv] = await db
      .insert(conversations)
      .values({ userId, title, subject: subjectId })
      .returning({ id: conversations.id });

    return conv.id;
  }

  private static async loadHistory(conversationId: string): Promise<AIMessage[]> {
    const messages = await db
      .select({ role: conversationMessages.role, content: conversationMessages.content })
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(asc(conversationMessages.createdAt))
      .limit(MAX_HISTORY_MESSAGES);

    return messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  }

  private static buildUserPrompt(
    questionText: string, contextText: string, topic?: string, subtopic?: string
  ): string {
    const topicLine = topic ? `\nנושא: ${topic}${subtopic ? ` → ${subtopic}` : ''}` : '';
    return `שאלה: ${questionText}${topicLine}\n\n${contextText ? `חומר לימוד רלוונטי:\n${contextText}` : ''}\n\nענה בפורמט JSON המדויק. ללא מלל מחוץ לאובייקט ה-JSON.`;
  }

  private static buildContextFromChunks(chunks: KnowledgeChunk[]): string {
    if (chunks.length === 0) return '';
    return chunks.map((c, i) => `[מקור ${i + 1}: ${c.source}]\n${c.text}`).join('\n\n---\n\n');
  }

  private static parseStructuredResponse(rawText: string): TutorStructuredResponse {
    const cleaned = rawText
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return TutorStructuredResponseSchema.parse(parsed);
    } catch {
      return {
        explanation: rawText,
        steps: [{ number: 1, title: 'הסבר', content: rawText }],
        hints: ['קרא שוב את השאלה בעיון', 'חשוב על מה נדרש', 'נסה לפרק לחלקים קטנים'],
        misconceptions: [],
        socraticQuestion: undefined,
      };
    }
  }
}
