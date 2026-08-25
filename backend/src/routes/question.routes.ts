import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { QuestionService } from '@/services/question.service';
import { KnowledgeService } from '@/services/knowledge.service';

const askQuestionSchema = z.object({
  text: z.string().min(1, 'Question is required'),
  imageUrls: z.array(z.string().url()).optional(),
});

interface AskQuestionBody {
  text: string;
  imageUrls?: string[];
}

interface QuestionIdParams {
  questionId: string;
}

interface HintBody {
  questionText: string;
  previousExplanation: string;
}

interface SolutionBody {
  questionText: string;
}

interface KnowledgeSearchQuery {
  q: string;
  limit?: string;
}

export async function questionRoutes(app: FastifyInstance) {
  app.post<{ Body: AskQuestionBody }>(
    '/api/v1/questions/ask',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Body: AskQuestionBody }>, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const body = askQuestionSchema.parse(request.body);

        // Process question: analyze → search → answer
        const result = await QuestionService.processQuestion(
          request.user.userId,
          body.text,
          body.imageUrls
        );

        // Return response
        reply.status(200).send({
          analysis: result.analysis,
          explanation: result.tutorResponse.explanation,
          sources: result.tutorResponse.sourceChunks,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }

        const message = error instanceof Error ? error.message : 'Failed to process question';
        reply.status(400).send({ error: message });
      }
    }
  );

  app.post<{ Params: QuestionIdParams; Body: HintBody }>(
    '/api/v1/questions/:questionId/hint',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Params: QuestionIdParams; Body: HintBody }>, reply: FastifyReply) => {
      try {
        const hintSchema = z.object({
          questionText: z.string(),
          previousExplanation: z.string(),
        });

        const body = hintSchema.parse(request.body);

        const hint = await QuestionService.getHint(
          body.questionText,
          body.previousExplanation
        );

        reply.status(200).send({ hint });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }

        const message = error instanceof Error ? error.message : 'Failed to generate hint';
        reply.status(400).send({ error: message });
      }
    }
  );

  app.post<{ Params: QuestionIdParams; Body: SolutionBody }>(
    '/api/v1/questions/:questionId/solution',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Params: QuestionIdParams; Body: SolutionBody }>, reply: FastifyReply) => {
      try {
        const solutionSchema = z.object({
          questionText: z.string(),
        });

        const body = solutionSchema.parse(request.body);

        const solution = await QuestionService.getSolution(body.questionText);

        reply.status(200).send({ solution });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }

        const message = error instanceof Error ? error.message : 'Failed to generate solution';
        reply.status(400).send({ error: message });
      }
    }
  );

  app.get<{ Querystring: KnowledgeSearchQuery }>(
    '/api/v1/knowledge/search',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Querystring: KnowledgeSearchQuery }>, reply: FastifyReply) => {
      try {
        const query = request.query.q;
        const limit = Math.min(parseInt(request.query.limit || '10'), 20);

        if (!query) {
          return reply.status(400).send({ error: 'Query parameter is required' });
        }

        const chunks = await KnowledgeService.searchChunks(query, limit);

        reply.status(200).send({
          results: chunks.map((chunk) => ({
            id: chunk.id,
            text: chunk.text.substring(0, 300),
            source: chunk.source,
            metadata: chunk.metadata,
          })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Search failed';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/knowledge/topics
  app.get(
    '/api/v1/knowledge/topics',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const topics = await KnowledgeService.getTopics();
        reply.status(200).send({ topics });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch topics';
        reply.status(400).send({ error: message });
      }
    }
  );

  app.get<{ Params: { chunkId: string } }>(
    '/api/v1/knowledge/chunks/:chunkId',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Params: { chunkId: string } }>, reply: FastifyReply) => {
      try {
        const chunk = await KnowledgeService.getChunkById(request.params.chunkId);

        if (!chunk) {
          return reply.status(404).send({ error: 'Chunk not found' });
        }

        reply.status(200).send(chunk);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch chunk';
        reply.status(400).send({ error: message });
      }
    }
  );
}
