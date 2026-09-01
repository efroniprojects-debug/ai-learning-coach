import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { QuestionService } from '@/services/question.service';
import { KnowledgeService } from '@/services/knowledge.service';
import { TutorService } from '@/services/tutor.service';
import { db, conversations, conversationMessages, conversationFolders } from '@/db';
import { eq, desc, and, asc, ilike, isNull } from 'drizzle-orm';
import { DEFAULT_SUBJECT_ID, getSubjectConfig, normalizeStudyUnits } from '@/config/subjects';
import { shouldRetrieveKnowledgeContext } from '@/config/question-context';

// ── Request schemas ───────────────────────────────────────────────────────────

const learningMemorySchema = z.object({
  isEnabled: z.boolean(),
  learningPreferences: z.string().max(1_000).nullable().optional(),
  knownStrengths: z.string().max(1_000).nullable().optional(),
  recurringMistakes: z.string().max(1_000).nullable().optional(),
});

const askQuestionBodySchema = z.object({
  text: z.string().min(1, 'Question is required').max(2000),
  imageUrls: z.array(z.string().url()).optional(),
  conversationId: z.string().uuid().optional(),
  subjectId: z.string().optional().default('physics'),
  studyUnits: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
  teachingStyle: z.enum(['concise', 'balanced', 'deep']).optional(),
  learningMemory: learningMemorySchema.optional(),
});

const streamQuestionBodySchema = z.object({
  text: z.string().min(1, 'Question is required').max(2000),
  conversationId: z.string().uuid().optional(),
  subjectId: z.string().optional().default('physics'),
  studyUnits: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
  imageData: z.string().optional(), // base64 image for Gemini Vision
  documentData: z.string().optional(),
  documentMimeType: z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]).optional(),
  documentName: z.string().max(255).optional(),
  mode: z.enum(['step_by_step', 'full', 'diagnose', 'concept']).optional(),
  teachingStyle: z.enum(['concise', 'balanced', 'deep']).optional(),
  learningMemory: learningMemorySchema.optional(),
  topic: z.string().optional(),
  subtopic: z.string().optional(),
});

type AskQuestionBody = z.infer<typeof askQuestionBodySchema>;
type StreamQuestionBody = z.infer<typeof streamQuestionBodySchema>;

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

// ── Routes ────────────────────────────────────────────────────────────────────

export async function questionRoutes(app: FastifyInstance) {

  // POST /api/v1/questions/ask — full structured response (non-streaming)
  app.post<{ Body: AskQuestionBody }>(
    '/api/v1/questions/ask',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Body: AskQuestionBody }>, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const body = askQuestionBodySchema.parse(request.body);
        getSubjectConfig(body.subjectId);
        const studyUnits = normalizeStudyUnits(body.subjectId, body.studyUnits);
        const ragContext = await KnowledgeService.searchChunks(body.text, 5, body.subjectId, studyUnits);

        const result = await TutorService.answerQuestion(
          {
            text: body.text,
            imageUrls: body.imageUrls,
            userId: request.user.userId,
            subjectId: body.subjectId,
            studyUnits,
            conversationId: body.conversationId,
            teachingStyle: body.teachingStyle,
            learningMemory: body.learningMemory,
          },
          ragContext
        );

        return reply.status(200).send({
          conversationId: result.conversationId,
          messageId: result.messageId,
          explanation: result.structured.explanation,
          steps: result.structured.steps,
          hints: result.structured.hints,
          misconceptions: result.structured.misconceptions,
          socraticQuestion: result.structured.socraticQuestion,
          sources: result.sourceChunks,
          // Legacy field for backward compat with existing ResponseDisplay
          content: result.structured.explanation,
          provider: 'claude',
          model: 'structured',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }
        const message = error instanceof Error ? error.message : 'Failed to process question';
        return reply.status(500).send({ error: message });
      }
    }
  );

  // POST /api/v1/questions/stream — SSE streaming response
  app.post<{ Body: StreamQuestionBody }>(
    '/api/v1/questions/stream',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Body: StreamQuestionBody }>, reply: FastifyReply) => {
      if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

      let body: StreamQuestionBody;
      try {
        body = streamQuestionBodySchema.parse(request.body);
        getSubjectConfig(body.subjectId);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }
        return reply.status(400).send({ error: 'Invalid request' });
      }

      // The route owns the raw response for the lifetime of the SSE stream.
      // Without hijack Fastify may auto-complete the response with an empty body.
      reply.hijack();

      // Set SSE headers — must happen before any write
      reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');
      reply.raw.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      reply.raw.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      reply.raw.flushHeaders();

      const sendEvent = (data: object): boolean => {
        if (reply.raw.destroyed || reply.raw.writableEnded) return false;
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
        return true;
      };

      // This first event proves that the handler started and prevents an empty
      // 200 response while RAG or Gemini are still working.
      sendEvent({ type: 'status', stage: 'route_started' });

      try {
        // RAG: try DB search, fall back to empty if DB unavailable
        let ragContext: Awaited<ReturnType<typeof KnowledgeService.searchChunks>> = [];
        if (shouldRetrieveKnowledgeContext(body)) {
          sendEvent({ type: 'status', stage: 'rag_started' });
          try {
            ragContext = await withTimeout(
              KnowledgeService.searchChunks(body.text, 5, body.subjectId, body.studyUnits),
              5_000,
              'RAG'
            );
            sendEvent({ type: 'status', stage: 'rag_completed', chunks: ragContext.length });
          } catch (ragErr) {
            app.log.warn('RAG search failed, continuing without context: ' + String(ragErr));
            sendEvent({ type: 'status', stage: 'rag_skipped', reason: ragErr instanceof Error ? ragErr.message : String(ragErr) });
          }
        } else {
          // A direct attachment is a real source, not a failed/empty RAG lookup.
          sendEvent({ type: 'status', stage: 'attachment_ready', reason: 'direct_attachment_is_primary_source' });
        }

        sendEvent({ type: 'status', stage: 'gemini_started' });
        for await (const event of TutorService.streamAnswer(
          {
            text: body.text,
            userId: request.user.userId,
            subjectId: body.subjectId,
            studyUnits: normalizeStudyUnits(body.subjectId, body.studyUnits),
            conversationId: body.conversationId,
            imageData: body.imageData,
            documentData: body.documentData,
            documentMimeType: body.documentMimeType,
            documentName: body.documentName,
            mode: body.mode,
            teachingStyle: body.teachingStyle,
            learningMemory: body.learningMemory,
            topic: body.topic,
            subtopic: body.subtopic,
          },
          ragContext
        )) {
          if (event.type === 'delta') {
            sendEvent({ type: 'delta', text: event.text });
          } else {
            sendEvent({
              type: 'done',
              conversationId: event.data.conversationId,
              messageId: event.data.messageId,
              structured: event.data.structured,
              sources: event.data.sourceChunks,
              masteryUpdate: event.data.masteryUpdate,
            });
            void import('@/services/drive.service').then(({ DriveService }) =>
              DriveService.saveConversationTranscript({
                conversationId: event.data.conversationId,
                title: body.text.slice(0, 80),
                question: body.text,
                explanation: event.data.structured.explanation,
                steps: event.data.structured.steps,
                hints: event.data.structured.hints,
              })
            ).catch((driveError) => app.log.warn({ driveError }, 'Conversation auto-save to Drive failed'));
          }
        }
      } catch (error) {
        sendEvent({
          type: 'error',
          message: error instanceof Error ? error.message : 'Stream failed',
        });
      } finally {
        if (!reply.raw.writableEnded) reply.raw.end();
      }
    }
  );

  // GET /api/v1/conversations — list user's conversations
  app.get<{ Querystring: { q?: string; folderId?: string; subjectId?: string; studyUnits?: string } }>(
    '/api/v1/conversations',
    { preHandler: authMiddleware },
    async (request, reply) => {
      if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

      const conditions = [eq(conversations.userId, request.user.userId)];
      const subjectId = request.query.subjectId ?? DEFAULT_SUBJECT_ID;
      getSubjectConfig(subjectId);
      conditions.push(eq(conversations.subject, subjectId));
      conditions.push(eq(conversations.studyUnits, normalizeStudyUnits(subjectId, Number(request.query.studyUnits))));
      const query = request.query.q?.trim();
      if (query) conditions.push(ilike(conversations.title, `%${query}%`));
      if (request.query.folderId === 'unfiled') conditions.push(isNull(conversations.folderId));
      else if (request.query.folderId) conditions.push(eq(conversations.folderId, request.query.folderId));

      const convs = await db
        .select({
          id: conversations.id,
          title: conversations.title,
          subject: conversations.subject,
          studyUnits: conversations.studyUnits,
          folderId: conversations.folderId,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .where(and(...conditions))
        .orderBy(desc(conversations.updatedAt))
        .limit(100);

      return reply.status(200).send({ conversations: convs });
    }
  );

  app.get('/api/v1/conversation-folders', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const folders = await db.select().from(conversationFolders)
      .where(eq(conversationFolders.userId, request.user.userId))
      .orderBy(asc(conversationFolders.name));
    return reply.send({ folders });
  });

  app.post<{ Body: { name: string } }>('/api/v1/conversation-folders', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const name = request.body.name?.trim();
    if (!name || name.length > 120) return reply.status(400).send({ error: 'שם תיקייה אינו תקין' });
    try {
      const [folder] = await db.insert(conversationFolders).values({ userId: request.user.userId, name }).returning();
      return reply.status(201).send({ folder });
    } catch {
      return reply.status(409).send({ error: 'כבר קיימת תיקייה בשם הזה' });
    }
  });

  app.patch<{ Params: { folderId: string }; Body: { name: string } }>('/api/v1/conversation-folders/:folderId', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const name = request.body.name?.trim();
    if (!name || name.length > 120) return reply.status(400).send({ error: 'שם תיקייה אינו תקין' });
    const [folder] = await db.update(conversationFolders).set({ name, updatedAt: new Date() })
      .where(and(eq(conversationFolders.id, request.params.folderId), eq(conversationFolders.userId, request.user.userId))).returning();
    if (!folder) return reply.status(404).send({ error: 'התיקייה לא נמצאה' });
    return reply.send({ folder });
  });

  app.delete<{ Params: { folderId: string } }>('/api/v1/conversation-folders/:folderId', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const [folder] = await db.delete(conversationFolders)
      .where(and(eq(conversationFolders.id, request.params.folderId), eq(conversationFolders.userId, request.user.userId))).returning({ id: conversationFolders.id });
    if (!folder) return reply.status(404).send({ error: 'התיקייה לא נמצאה' });
    return reply.status(204).send();
  });

  app.patch<{ Params: { conversationId: string }; Body: { title?: string; folderId?: string | null } }>('/api/v1/conversations/:conversationId', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const changes: { title?: string; folderId?: string | null; updatedAt: Date } = { updatedAt: new Date() };
    if (request.body.title !== undefined) {
      const title = request.body.title.trim();
      if (!title || title.length > 500) return reply.status(400).send({ error: 'שם השיחה אינו תקין' });
      changes.title = title;
    }
    if (request.body.folderId !== undefined) {
      if (request.body.folderId) {
        const [ownedFolder] = await db.select({ id: conversationFolders.id }).from(conversationFolders)
          .where(and(eq(conversationFolders.id, request.body.folderId), eq(conversationFolders.userId, request.user.userId))).limit(1);
        if (!ownedFolder) return reply.status(400).send({ error: 'התיקייה לא נמצאה' });
      }
      changes.folderId = request.body.folderId;
    }
    const [conversation] = await db.update(conversations).set(changes)
      .where(and(eq(conversations.id, request.params.conversationId), eq(conversations.userId, request.user.userId))).returning();
    if (!conversation) return reply.status(404).send({ error: 'השיחה לא נמצאה' });
    return reply.send({ conversation });
  });

  app.delete<{ Params: { conversationId: string } }>('/api/v1/conversations/:conversationId', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const [conversation] = await db.delete(conversations)
      .where(and(eq(conversations.id, request.params.conversationId), eq(conversations.userId, request.user.userId))).returning({ id: conversations.id });
    if (!conversation) return reply.status(404).send({ error: 'השיחה לא נמצאה' });
    return reply.status(204).send();
  });

  // GET /api/v1/conversations/:conversationId/messages
  app.get<{ Params: { conversationId: string } }>(
    '/api/v1/conversations/:conversationId/messages',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Params: { conversationId: string } }>,
      reply: FastifyReply
    ) => {
      if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

      // Verify ownership
      const conv = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          and(
            eq(conversations.id, request.params.conversationId),
            eq(conversations.userId, request.user.userId)
          )
        )
        .limit(1);

      if (conv.length === 0) return reply.status(404).send({ error: 'Conversation not found' });

      const messages = await db
        .select({
          id: conversationMessages.id,
          role: conversationMessages.role,
          content: conversationMessages.content,
          structuredData: conversationMessages.structuredData,
          createdAt: conversationMessages.createdAt,
        })
        .from(conversationMessages)
        .where(eq(conversationMessages.conversationId, request.params.conversationId))
        .orderBy(asc(conversationMessages.createdAt));

      return reply.status(200).send({ messages });
    }
  );

  // ── Knowledge search endpoints ─────────────────────────────────────────────

  app.get<{ Querystring: { q: string; limit?: string; subjectId?: string; studyUnits?: string } }>(
    '/api/v1/knowledge/search',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const query = request.query.q;
        const limit = Math.min(parseInt(request.query.limit || '10'), 20);
        if (!query) return reply.status(400).send({ error: 'Query parameter is required' });

        const subjectId = request.query.subjectId ?? DEFAULT_SUBJECT_ID;
        const chunks = await KnowledgeService.searchChunks(query, limit, subjectId, Number(request.query.studyUnits));
        return reply.status(200).send({
          results: chunks.map((chunk) => ({
            id: chunk.id,
            text: chunk.text.substring(0, 300),
            source: chunk.source,
            metadata: chunk.metadata,
          })),
        });
      } catch (error) {
        return reply.status(400).send({ error: error instanceof Error ? error.message : 'Search failed' });
      }
    }
  );

  app.get(
    '/api/v1/knowledge/topics',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const topics = await KnowledgeService.getTopics();
        return reply.status(200).send({ topics });
      } catch (error) {
        return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to fetch topics' });
      }
    }
  );

  // GET hint for a previous response
  app.post<{ Body: { questionText: string; previousExplanation: string } }>(
    '/api/v1/questions/hint',
    { preHandler: authMiddleware },
    async (request, reply) => {
      if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
      try {
        const { questionText, previousExplanation } = request.body;
        const ragContext = await KnowledgeService.searchChunks(questionText, 3);
        const hint = await TutorService.generateHint(
          questionText,
          previousExplanation,
          ragContext,
          request.user.userId
        );
        return reply.status(200).send({ hint });
      } catch (error) {
        return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to generate hint' });
      }
    }
  );
}
