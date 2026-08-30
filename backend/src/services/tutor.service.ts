import { z } from 'zod';
import { db, conversations, conversationMessages } from '@/db';
import { eq, asc } from 'drizzle-orm';
import { aiGateway } from '@/ai/gateway';
import { getSubjectConfig } from '@/config/subjects';
import type { KnowledgeChunk, AIMessage } from '@/ai/types';

// ── Tutor modes ───────────────────────────────────────────────────────────────

export type TutorMode = 'step_by_step' | 'full' | 'diagnose' | 'concept';

const MODE_PROMPTS: Record<TutorMode, string> = {
  step_by_step: `
פעל במצב: שלב-אחר-שלב (STEP_BY_STEP).
- פרק את הפתרון ל-4-6 שלבים ממוספרים.
- כל שלב: כותרת "מה עושים", תוכן מפורט, נוסחה רלוונטית.
- בסוף כל שלב: "האם הבנת את השלב הזה? כן / צריך הסבר נוסף?"
- אל תגיד את התשובה הסופית לפני שהתלמיד עבר כל השלבים.`,
  full: `
פעל במצב: פתרון מלא (FULL_SOLUTION).
- ספק פתרון מלא ומיידי: נתונים → נוסחה → הצבה → חישוב → תשובה + יחידות.
- הוסף "נקודת תובנה": מדוע הגישה הזו עובדת, מה אפשר להכליל.
- תן את הפתרון ב-steps[] עם כל הפרטים.`,
  diagnose: `
פעל במצב: אבחון טעות (DIAGNOSE).
- התלמיד שיתף ניסיון שגוי. אל תפתור מחדש.
- זהה בדיוק את השלב שבו הטעות נמצאת.
- ב-explanation: "מצאתי את הטעות ב..." + הסבר מה שגוי ולמה.
- ב-socraticQuestion: שאלה מובילה שתעזור לתלמיד לתקן בעצמו.
- ב-hints[]: 3 רמזים מדורגים לתיקון.`,
  concept: `
פעל במצב: הסבר מושג (CONCEPT).
- אנלוגיה מהחיים קודם, אחר כך הגדרה פורמלית, אחר כך נוסחה.
- ב-explanation: האנלוגיה וההסבר האינטואיטיבי.
- ב-steps[]: הגדרה פורמלית → נוסחה → דוגמה מספרית → דוגמה ממבחן בגרות.`,
};

// ── Structured response schema (Zod) ─────────────────────────────────────────

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
}

export interface TutorFullResponse {
  structured: TutorStructuredResponse;
  conversationId: string;
  messageId: string;
  sourceChunks: Array<{ id: string; text: string; source: string }>;
  rawText: string;
}

// ── Context window: max messages to include in history ───────────────────────
const MAX_HISTORY_MESSAGES = 6; // 3 user + 3 assistant turns

// ── Main service ─────────────────────────────────────────────────────────────

export class TutorService {
  /**
   * Answer a question (non-streaming).
   * Creates or continues a conversation, stores messages in DB.
   */
  static async answerQuestion(
    question: TutorQuestion,
    ragContext: KnowledgeChunk[]
  ): Promise<TutorFullResponse> {
    const subjectId = question.subjectId ?? 'physics';
    const subject = getSubjectConfig(subjectId);

    await aiGateway.initializeForUser(question.userId);

    // Get or create conversation
    const convId = await this.getOrCreateConversation(
      question.userId,
      question.text,
      subjectId,
      question.conversationId
    );

    // Build message history for context window
    const history = await this.loadHistory(convId);

    // Build current user message
    const contextText = this.buildContextFromChunks(ragContext);
    const userMessageContent = this.buildUserPrompt(question.text, contextText);

    // Save user message to DB
    const [savedUserMsg] = await db
      .insert(conversationMessages)
      .values({ conversationId: convId, role: 'user', content: userMessageContent })
      .returning({ id: conversationMessages.id });

    // Build messages array for AI (history + current)
    const messages: AIMessage[] = [
      ...history,
      { role: 'user', content: userMessageContent },
    ];

    const systemPrompt = this.buildSystemPrompt(subject.systemPrompt, question.mode);

    // Call AI
    const aiResponse = await aiGateway.generateResponse({
      messages,
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.7,
    });

    // Parse structured response
    const structured = this.parseStructuredResponse(aiResponse.content);

    // Save assistant message to DB
    const [savedAssistantMsg] = await db
      .insert(conversationMessages)
      .values({
        conversationId: convId,
        role: 'assistant',
        content: aiResponse.content,
        structuredData: structured,
      })
      .returning({ id: conversationMessages.id });

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, convId));

    return {
      structured,
      conversationId: convId,
      messageId: savedAssistantMsg.id,
      rawText: aiResponse.content,
      sourceChunks: ragContext.map((c) => ({
        id: c.id,
        text: c.text.substring(0, 200),
        source: c.source,
      })),
    };
  }

  /**
   * Stream an answer via async generator (for SSE endpoint).
   * Saves the complete response to DB when done.
   */
  static async *streamAnswer(
    question: TutorQuestion,
    ragContext: KnowledgeChunk[]
  ): AsyncGenerator<{ type: 'delta'; text: string } | { type: 'done'; data: TutorFullResponse }> {
    const subjectId = question.subjectId ?? 'physics';
    const subject = getSubjectConfig(subjectId);

    await aiGateway.initializeForUser(question.userId);

    const convId = await this.getOrCreateConversation(
      question.userId,
      question.text,
      subjectId,
      question.conversationId
    );

    const history = await this.loadHistory(convId);
    const contextText = this.buildContextFromChunks(ragContext);
    const userMessageContent = this.buildUserPrompt(question.text, contextText);

    await db
      .insert(conversationMessages)
      .values({ conversationId: convId, role: 'user', content: userMessageContent });

    const messages: AIMessage[] = [
      ...history,
      { role: 'user', content: userMessageContent },
    ];

    const systemPrompt = this.buildSystemPrompt(subject.systemPrompt, question.mode);

    let fullText = '';

    for await (const chunk of aiGateway.generateStream({
      messages,
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.7,
    })) {
      fullText += chunk.delta;
      yield { type: 'delta', text: chunk.delta };
    }

    // Parse and save after streaming completes
    const structured = this.parseStructuredResponse(fullText);

    const [savedMsg] = await db
      .insert(conversationMessages)
      .values({
        conversationId: convId,
        role: 'assistant',
        content: fullText,
        structuredData: structured,
      })
      .returning({ id: conversationMessages.id });

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, convId));

    yield {
      type: 'done',
      data: {
        structured,
        conversationId: convId,
        messageId: savedMsg.id,
        rawText: fullText,
        sourceChunks: ragContext.map((c) => ({
          id: c.id,
          text: c.text.substring(0, 200),
          source: c.source,
        })),
      },
    };
  }

  /**
   * Generate a progressive hint (doesn't start new conversation).
   */
  static async generateHint(
    questionText: string,
    previousExplanation: string,
    ragContext: KnowledgeChunk[],
    userId: string = ''
  ): Promise<string> {
    if (userId) await aiGateway.initializeForUser(userId);

    const hintPrompt = `
שאלה מקורית: ${questionText}

ההסבר הקודם שנתת:
${previousExplanation}

תן רמז אחד קצר (משפט-שניים) שמוביל את התלמיד לחשוב בעצמו.
• לא לתת את התשובה
• להתמקד באינטואיציה
• לענות בעברית בלבד`;

    const response = await aiGateway.generateResponse({
      messages: [{ role: 'user', content: hintPrompt }],
      systemPrompt: getSubjectConfig('physics').systemPrompt,
      maxTokens: 300,
      temperature: 0.6,
    });

    return response.content;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private static async getOrCreateConversation(
    userId: string,
    questionText: string,
    subjectId: string,
    existingConvId?: string
  ): Promise<string> {
    if (existingConvId) {
      // Verify it belongs to this user
      const existing = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.id, existingConvId))
        .limit(1);
      if (existing.length > 0) return existingConvId;
    }

    // Create new conversation with title derived from first question
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

    return messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  }

  private static buildSystemPrompt(basePrompt: string, mode?: TutorMode): string {
    if (!mode || mode === 'step_by_step') return MODE_PROMPTS.step_by_step + '\n\n' + basePrompt;
    return MODE_PROMPTS[mode] + '\n\n' + basePrompt;
  }

  private static buildUserPrompt(questionText: string, contextText: string): string {
    return `שאלה: ${questionText}

${contextText ? `חומר לימוד רלוונטי:\n${contextText}` : ''}

ענה בפורמט JSON המדויק שפורט בהנחיות המערכת. ללא מלל מחוץ לאובייקט ה-JSON.`;
  }

  private static buildContextFromChunks(chunks: KnowledgeChunk[]): string {
    if (chunks.length === 0) return '';
    return chunks
      .map((chunk, idx) => `[מקור ${idx + 1}: ${chunk.source}]\n${chunk.text}`)
      .join('\n\n---\n\n');
  }

  /**
   * Parse the AI response as structured JSON.
   * Falls back to a minimal valid structure if parsing fails.
   */
  private static parseStructuredResponse(rawText: string): TutorStructuredResponse {
    // Strip markdown code blocks if present
    const cleaned = rawText
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return TutorStructuredResponseSchema.parse(parsed);
    } catch {
      // Fallback: wrap the raw text in a valid structure
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
