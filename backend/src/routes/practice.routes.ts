import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { PracticeService } from '@/services/practice.service';

const submitAttemptSchema = z.object({
  conceptId: z.string().min(1),
  isCorrect: z.boolean(),
  timeSpentSeconds: z.number().min(0),
});

export async function practiceRoutes(app: FastifyInstance) {
  // GET /api/v1/practice/next-recommendation
  app.get(
    '/api/v1/practice/next-recommendation',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const recommendation = await PracticeService.getRecommendation(request.user.userId);
        reply.status(200).send(recommendation);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get recommendation';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/practice/select-problem
  app.get(
    '/api/v1/practice/select-problem',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const problem = await PracticeService.selectNextProblem(request.user.userId);
        reply.status(200).send(problem);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to select problem';
        reply.status(400).send({ error: message });
      }
    }
  );

  // POST /api/v1/practice/submit-attempt
  app.post<{ Body: unknown }>(
    '/api/v1/practice/submit-attempt',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const body = submitAttemptSchema.parse(request.body);
        const result = await PracticeService.submitAttempt(
          request.user.userId,
          body.conceptId,
          body.isCorrect,
          body.timeSpentSeconds
        );

        reply.status(200).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }
        const message = error instanceof Error ? error.message : 'Submission failed';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/practice/history
  app.get(
    '/api/v1/practice/history',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const history = await PracticeService.getPracticeHistory(request.user.userId);
        reply.status(200).send({ attempts: history });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get history';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/practice/mastery-overview
  app.get(
    '/api/v1/practice/mastery-overview',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const overview = await PracticeService.getMasteryOverview(request.user.userId);
        reply.status(200).send(overview);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get mastery overview';
        reply.status(400).send({ error: message });
      }
    }
  );
}
