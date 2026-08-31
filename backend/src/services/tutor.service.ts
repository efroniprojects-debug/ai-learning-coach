import { z } from 'zod';
import { db, conversations, conversationMessages, skillMastery } from '@/db';
import { eq, asc, and, sql } from 'drizzle-orm';
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
  imageData?: string; // base64 image for Gemini Vision
  documentData?: string;
  documentMimeType?: string;
  documentName?: string;
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
  masteryUpdate?: { subtopic: string; previousElo: number; elo: number; confidence: string };
}

const MAX_HISTORY_MESSAGES = 6;
const DB_TIMEOUT_MS = 5_000;
const GEMINI_TIMEOUT_MS = 90_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(
      () => reject(new Error(`${operation}_TIMEOUT_AFTER_${timeoutMs}MS`)),
      timeoutMs
    );

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

export class TutorService {
  static async answerQuestion(
    question: TutorQuestion,
    ragContext: KnowledgeChunk[]
  ): Promise<TutorFullResponse> {
    const subjectId = question.subjectId ?? 'physics';
    const systemPrompt = buildSystemPrompt(question.mode);

    await aiGateway.initializeForUser(question.userId);

    // Try DB operations, fall back gracefully if unavailable
    let convId = 'no-db-' + Date.now();
    let history: import('@/ai/types').AIMessage[] = [];
    try {
      convId = await this.getOrCreateConversation(
        question.userId, question.text, subjectId, question.conversationId
      );
      history = await this.loadHistory(convId);
      const userMessageContent = this.buildUserPrompt(
        question.text, this.buildContextFromChunks(ragContext), question.topic, question.subtopic
      );
      await db.insert(conversationMessages).values({
        conversationId: convId, role: 'user', content: userMessageContent,
      });
    } catch (dbErr) {
      console.warn('DB unavailable, continuing without history:', String(dbErr));
    }
    const contextText = this.buildContextFromChunks(ragContext);
    const userMessageContent = this.buildUserPrompt(
      question.text, contextText, question.topic, question.subtopic
    );

    const messages: AIMessage[] = [
      ...history,
      { role: 'user', content: userMessageContent },
    ];

    const aiResponse = await aiGateway.generateResponse({
      messages, systemPrompt, maxTokens: 2048, temperature: 0.7,
    });

    const structured = this.parseStructuredResponse(aiResponse.content);
    const masteryUpdate = await this.updateMastery(question, structured);

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
      masteryUpdate,
      sourceChunks: ragContext.map((c) => ({ id: c.id, text: c.text.substring(0, 200), source: c.source })),
    };
  }

  static async *streamAnswer(
    question: TutorQuestion,
    ragContext: KnowledgeChunk[]
  ): AsyncGenerator<{ type: 'delta'; text: string } | { type: 'done'; data: TutorFullResponse }> {
    const subjectId = question.subjectId ?? 'physics';
    const systemPrompt = buildSystemPrompt(question.mode);

    // Try DB operations, fall back gracefully if unavailable
    let convId = 'no-db-' + Date.now();
    let history: import('@/ai/types').AIMessage[] = [];
    try {
      const prepared = await withTimeout((async () => {
        const conversationId = await this.getOrCreateConversation(
          question.userId, question.text, subjectId, question.conversationId
        );
        const conversationHistory = await this.loadHistory(conversationId);
        const userMessageContent = this.buildUserPrompt(
          question.text, this.buildContextFromChunks(ragContext), question.topic, question.subtopic
        );
        await db.insert(conversationMessages).values({
          conversationId, role: 'user', content: userMessageContent,
        });
        return { conversationId, conversationHistory };
      })(), DB_TIMEOUT_MS, 'DB_PREPARE');
      convId = prepared.conversationId;
      history = prepared.conversationHistory;
    } catch (dbErr) {
      console.warn('DB unavailable, continuing without history:', String(dbErr));
    }
    const contextText = this.buildContextFromChunks(ragContext);
    const userMessageContent = this.buildUserPrompt(
      question.text, contextText, question.topic, question.subtopic
    );

    // ── Gemini direct call (supports Vision when imageData present) ──────────
    const apiKey = process.env.DEMO_GEMINI_API_KEY;
    if (!apiKey) throw new Error('DEMO_GEMINI_API_KEY is not configured');

    const promptText = `${systemPrompt}\n\n${userMessageContent}`;

    // Build history parts for multi-turn
    const historyContents = history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Build current user turn parts
    type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
    const attachmentInstruction = question.documentName
      ? `\n\nלשאלה מצורף המסמך "${question.documentName}". יש לקרוא אותו ולהסתמך עליו בתשובה.`
      : '';
    const currentParts: GeminiPart[] = [{ text: promptText + attachmentInstruction }];
    if (question.imageData) {
      currentParts.push({ inline_data: { mime_type: 'image/jpeg', data: question.imageData } });
    }
    if (question.documentData && question.documentMimeType) {
      currentParts.push({ inline_data: { mime_type: question.documentMimeType, data: question.documentData } });
    }

    const contents = [
      ...historyContents,
      { role: 'user', parts: currentParts },
    ];

    // Use generateContent with X-goog-api-key header (supports AQ. format keys)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`;

    const geminiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });

    const rawGeminiResponse = await geminiRes.text();

    let geminiData: {
      error?: { message?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      promptFeedback?: { blockReason?: string };
    };

    try {
      geminiData = JSON.parse(rawGeminiResponse) as typeof geminiData;
    } catch {
      throw new Error(`Gemini returned invalid JSON (HTTP ${geminiRes.status})`);
    }

    if (!geminiRes.ok) {
      throw new Error(geminiData.error?.message || `Gemini API error: ${geminiRes.status}`);
    }

    const fullText = geminiData.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim() ?? '';
    if (!fullText) {
      const blockReason = geminiData.promptFeedback?.blockReason ?? 'none';
      throw new Error(`Gemini returned empty response (blockReason: ${blockReason})`);
    }

    const structured = this.parseStructuredResponse(fullText);
    const masteryUpdate = await this.updateMastery(question, structured);

    let savedMsgId = 'no-db-' + Date.now();
    try {
      savedMsgId = await withTimeout((async () => {
        const [savedMsg] = await db
          .insert(conversationMessages)
          .values({ conversationId: convId, role: 'assistant', content: fullText, structuredData: structured })
          .returning({ id: conversationMessages.id });
        await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, convId));
        return savedMsg.id;
      })(), DB_TIMEOUT_MS, 'DB_SAVE_ASSISTANT');
    } catch (dbErr) {
      console.warn('Could not save assistant message to DB:', String(dbErr));
    }

    yield {
      type: 'done',
      data: {
        structured,
        conversationId: convId,
        messageId: savedMsgId,
        rawText: fullText,
        masteryUpdate,
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

  private static confidenceForElo(elo: number): string {
    if (elo >= 1600) return 'expert';
    if (elo >= 1400) return 'proficient';
    if (elo >= 1200) return 'intermediate';
    return 'novice';
  }

  private static async updateMastery(
    question: TutorQuestion,
    structured: TutorStructuredResponse
  ): Promise<TutorFullResponse['masteryUpdate']> {
    if (!question.subtopic) return undefined;
    const hasErrorSignal = question.mode === 'diagnose' || structured.misconceptions.length > 0;
    const delta = hasErrorSignal ? -30 :
      (question.mode === 'step_by_step' || question.mode === 'full') ? 20 : 0;
    if (delta === 0) return undefined;

    try {
      const existing = await db.query.skillMastery.findFirst({
        where: and(
          eq(skillMastery.userId, question.userId),
          eq(skillMastery.conceptId, question.subtopic)
        ),
      });
      const previousElo = existing?.eloRating ?? 1000;
      const nextElo = Math.max(400, Math.min(2000, previousElo + delta));
      const confidence = this.confidenceForElo(nextElo);

      await db.insert(skillMastery).values({
        userId: question.userId,
        conceptId: question.subtopic,
        eloRating: nextElo,
        attemptsCount: (existing?.attemptsCount ?? 0) + 1,
        correctAttempts: (existing?.correctAttempts ?? 0) + (delta > 0 ? 1 : 0),
        lastAttemptedAt: new Date(),
        confidenceLevel: confidence,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: [skillMastery.userId, skillMastery.conceptId],
        set: {
          eloRating: nextElo,
          attemptsCount: sql`${skillMastery.attemptsCount} + 1`,
          correctAttempts: delta > 0
            ? sql`${skillMastery.correctAttempts} + 1`
            : sql`${skillMastery.correctAttempts}`,
          lastAttemptedAt: new Date(),
          confidenceLevel: confidence,
          updatedAt: new Date(),
        },
      });
      return { subtopic: question.subtopic, previousElo, elo: nextElo, confidence };
    } catch (error) {
      console.warn('Could not update skill mastery:', String(error));
      return undefined;
    }
  }

  private static buildUserPrompt(
    questionText: string, contextText: string, topic?: string, subtopic?: string
  ): string {
    const topicLine = topic ? `\nנושא: ${topic}${subtopic ? ` → ${subtopic}` : ''}` : '';
    const citationInstruction = contextText
      ? '\nהסתמך על החומר הרלוונטי, וציין בתוך ההסבר הפניות בפורמט [מקור 1], [מקור 2] לפי הצורך.'
      : '';
    return `שאלה: ${questionText}${topicLine}\n\n${contextText ? `חומר לימוד רלוונטי:\n${contextText}` : ''}${citationInstruction}\n\nענה בפורמט JSON המדויק. ללא מלל מחוץ לאובייקט ה-JSON.`;
  }

  private static buildContextFromChunks(chunks: KnowledgeChunk[]): string {
    if (chunks.length === 0) return '';
    return chunks.map((c, i) => `[מקור ${i + 1}: ${c.source}]\n${c.text}`).join('\n\n---\n\n');
  }

  private static parseStructuredResponse(rawText: string): TutorStructuredResponse {
    return parseTutorStructuredResponse(rawText);
  }
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  };
  return text.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (entity) => entities[entity] ?? entity);
}

/** Keep model output display-safe even when it ignores the no-HTML instruction. */
export function normalizeTutorText(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\u200b|\ufeff/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeStructuredResponse(value: unknown): TutorStructuredResponse {
  const parsed = TutorStructuredResponseSchema.parse(value);
  return {
    explanation: normalizeTutorText(parsed.explanation),
    steps: parsed.steps.map((step) => ({
      number: step.number,
      title: normalizeTutorText(step.title),
      content: normalizeTutorText(step.content),
    })),
    hints: parsed.hints.map(normalizeTutorText),
    misconceptions: parsed.misconceptions.map((item) => ({
      misconception: normalizeTutorText(item.misconception),
      correction: normalizeTutorText(item.correction),
    })),
    socraticQuestion: parsed.socraticQuestion
      ? normalizeTutorText(parsed.socraticQuestion)
      : undefined,
  };
}

function extractJsonObject(rawText: string): string {
  const cleaned = rawText
    .replace(/\u200b|\ufeff/g, '')
    .replace(/^\s*\\?`\\?`\\?`(?:json)?\s*/i, '')
    .replace(/\s*\\?`\\?`\\?`\s*$/i, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  return firstBrace >= 0 && lastBrace > firstBrace
    ? cleaned.slice(firstBrace, lastBrace + 1)
    : cleaned;
}

function extractExplanationFallback(rawText: string): string | null {
  const match = extractJsonObject(rawText).match(/"explanation"\s*:\s*"((?:\\.|[^"\\])*)"/s);
  if (!match) return null;
  try {
    return normalizeTutorText(JSON.parse(`"${match[1]}"`) as string);
  } catch {
    return normalizeTutorText(match[1]);
  }
}

export function parseTutorStructuredResponse(rawText: string): TutorStructuredResponse {
  const jsonText = extractJsonObject(rawText);
  try {
    let parsed: unknown = JSON.parse(jsonText);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return normalizeStructuredResponse(parsed);
  } catch {
    const explanation = extractExplanationFallback(rawText);
    const safeExplanation = explanation || 'לא הצלחתי לסדר את התשובה. נסה לשלוח את השאלה שוב.';
    return {
      explanation: safeExplanation,
      steps: [{ number: 1, title: 'הסבר', content: safeExplanation }],
      hints: ['קרא שוב את השאלה בעיון', 'זהה את הנתונים והנעלם', 'נסה לפרק את הפתרון לשלבים'],
      misconceptions: [],
      socraticQuestion: undefined,
    };
  }
}
