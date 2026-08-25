import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { AISettingsService } from '@/services/ai-settings.service';

const saveProviderSchema = z.object({
  provider: z.enum(['claude', 'gemini', 'openai']),
  model: z.string().min(1, 'Model is required'),
  apiKey: z.string().min(1, 'API key is required'),
});

export async function aiSettingsRoutes(app: FastifyInstance) {
  // GET /api/v1/ai-settings/configs
  app.get(
    '/api/v1/ai-settings/configs',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const configs = await AISettingsService.getUserConfigs(request.user.userId);
        reply.status(200).send(configs);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get configs';
        reply.status(400).send({ error: message });
      }
    }
  );

  // POST /api/v1/ai-settings/save
  app.post(
    '/api/v1/ai-settings/save',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const body = saveProviderSchema.parse(request.body);
        const config = await AISettingsService.saveProviderConfig(
          request.user.userId,
          body.provider,
          body.model,
          body.apiKey
        );

        reply.status(200).send(config);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }

        const message = error instanceof Error ? error.message : 'Failed to save config';
        reply.status(400).send({ error: message });
      }
    }
  );

  // POST /api/v1/ai-settings/:configId/activate
  app.post(
    '/api/v1/ai-settings/:configId/activate',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Params: { configId: string } }>, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const config = await AISettingsService.setActiveConfig(
          request.user.userId,
          request.params.configId
        );

        reply.status(200).send(config);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to activate config';
        reply.status(400).send({ error: message });
      }
    }
  );

  // DELETE /api/v1/ai-settings/:configId
  app.delete(
    '/api/v1/ai-settings/:configId',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Params: { configId: string } }>, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        await AISettingsService.deleteConfig(request.user.userId, request.params.configId);

        reply.status(200).send({ success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete config';
        reply.status(400).send({ error: message });
      }
    }
  );
}
