import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '@/middleware/auth.middleware';
import { AuthService } from '@/services/auth.service';

const googleCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/google/callback
  app.post<{ Body: unknown }>(
    '/api/v1/auth/google/callback',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = googleCallbackSchema.parse(request.body);
        const result = await AuthService.handleGoogleCallback(body.code);

        reply.status(200).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }

        const message = error instanceof Error ? error.message : 'Authentication failed';
        reply.status(400).send({ error: message });
      }
    }
  );

  // POST /api/v1/auth/refresh
  app.post<{ Body: unknown }>(
    '/api/v1/auth/refresh',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'Missing authorization header' });
        }

        const accessToken = authHeader.substring(7);

        const body = refreshTokenSchema.parse(request.body);
        const result = await AuthService.refreshAccessToken(
          body.refreshToken,
          // Extract userId from old access token (before it expired)
          // For now, we'll rely on the client sending it
          request.headers['x-user-id'] as string
        );

        reply.status(200).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }

        const message = error instanceof Error ? error.message : 'Token refresh failed';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/auth/verify
  app.get(
    '/api/v1/auth/verify',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const user = await AuthService.getUserById(request.user.userId);
        reply.status(200).send(user);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get user';
        reply.status(400).send({ error: message });
      }
    }
  );

  // POST /api/v1/auth/logout
  app.post(
    '/api/v1/auth/logout',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          await AuthService.logout(token);
        }

        reply.status(200).send({ success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Logout failed';
        reply.status(400).send({ error: message });
      }
    }
  );
}
