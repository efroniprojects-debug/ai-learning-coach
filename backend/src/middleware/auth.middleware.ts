// Auth removed — open access, no authentication required
import type { FastifyRequest } from 'fastify';

// Inject a fixed local user so routes that use request.user still work
export async function authMiddleware(
  request: FastifyRequest
) {
  request.user = { userId: 'local-user-00000000', email: 'user@physiq.local' };
}

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    user?: { userId: string; email: string };
  }
}
