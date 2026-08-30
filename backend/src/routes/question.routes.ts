import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { QuestionService } from '@/services/question.service';
import { KnowledgeService } from '@/services/knowledge.service';
import { TutorService } from '@/services/tutor.service';
import { db, conversations, conversationMessages } from '@/db';
import { eq, desc, and, asc } from 'drizzle-orm';

// ── Request schemas ───────────────────────────────────────────────────────────

const askQuestionBodySchema = z.object({
  text: z.string().min(1, 'Question is required').max(2000),
  imageUrls: z.array(z.string().url()).optional(),
  conversationId: z.string().uuid().optional(),
  subjectId: z.string().optional().default('physics'),
});

const streamQuestionBodySchema = z.object({
  text: z.string().min(1, 'Question is required').max(2000),
  conversationId: z.string().uuid().optional(),
  subjectId: z.string().optional().default('physics'),
  imageData: z.string().optional(), // base64 image for Gemini Vision
  mode: z.enum(['step_by_step', 'full', 'diagnose', 'concept']).optional(),
  topic: z.string().optional(),
  subtopic: z.string().optional(),
});

type AskQuestionBody = z.infer<typeof askQuestionBodySchema>;
type StreamQuestionBody = z.infer<typeof streamQuestionBodySchema>;

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
        const ragContext = await KnowledgeService.searchChunks(body.text, 5);

        const result = await TutorService.answerQuestion(
          {
            text: body.text,
            imageUrls: body.imageUrls,
            userId: request.user.userId,
            subjectId: body.subjectId,
            conversationId: body.conversationId,
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
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }
        return reply.status(400).send({ error: 'Invalid request' });
      }

      // Set SSE headers — must happen before any write
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');
      reply.raw.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      reply.raw.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      reply.raw.flushHeaders();

      const sendEvent = (data: object) => {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
        // Force flush for Railway/nginx buffering
        if (typeof (reply.raw as any).flush === 'function') {
          (reply.raw as any).flush();
        }
      };

      // Clean up on client disconnect
      request.raw.on('close', () => {
        reply.raw.end();
      });

      try {
        const ragContext = await KnowledgeService.searchChunks(body.text, 5);

        for await (const event of TutorService.streamAnswer(
          {
            text: body.text,
            userId: request.user.userId,
            subjectId: body.subjectId,
            conversationId: body.conversationId,
            imageData: body.imageData,
            mode: body.mode,
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
            });
          }
        }
      } catch (error) {
        sendEvent({
          type: 'error',
          message: error instanceof Error ? error.message : 'Stream failed',
        });
      } finally {
        reply.raw.end();
      }
    }
  );

  // GET /api/v1/conversations — list user's conversations
  app.get(
    '/api/v1/conversations',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

      const convs = await db
        .select({
          id: conversations.id,
          title: conversations.title,
          subject: conversations.subject,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .where(eq(conversations.userId, request.user.userId))
        .orderBy(desc(conversations.updatedAt))
        .limit(20);

      return reply.status(200).send({ conversations: convs });
    }
  );

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

  app.get<{ Querystring: { q: string; limit?: string } }>(
    '/api/v1/knowledge/search',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        const query = request.query.q;
        const limit = Math.min(parseInt(request.query.limit || '10'), 20);
        if (!query) return reply.status(400).send({ error: 'Query parameter is required' });

        const chunks = await KnowledgeService.searchChunks(query, limit);
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
