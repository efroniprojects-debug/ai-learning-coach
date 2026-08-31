import type { FastifyInstance } from 'fastify';

import { authMiddleware } from '@/middleware/auth.middleware';
import { ContentAggregatorService } from '@/services/content-aggregator.service';

export async function contentRoutes(app: FastifyInstance) {
  app.post<{ Querystring: { topic?: string } }>('/api/v1/content/aggregate', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const topic = request.query.topic?.trim();
    if (!topic || topic.length > 120) return reply.status(400).send({ error: 'יש להזין נושא תקין' });
    try {
      const result = await ContentAggregatorService.aggregate(topic);
      if (result.sourcesIndexed === 0) {
        return reply.status(502).send({ error: 'המקורות המאומתים אינם זמינים כרגע', ...result });
      }
      return reply.send(result);
    } catch (error) {
      app.log.warn({ error, topic }, 'Verified content aggregation failed');
      return reply.status(502).send({ error: 'עדכון המקורות המאומתים נכשל' });
    }
  });
}
