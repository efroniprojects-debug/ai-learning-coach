// Auth removed — open access, no authentication required
import type { FastifyRequest } from 'fastify';

// Inject a fixed local user so routes that use request.user still work
export async function authMiddleware(
  request: FastifyRequest
) {
  request.user = {
    userId: '00000000-0000-4000-8000-000000000001',
    email: 'physiq-local-user@local.invalid',
  };
}

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    user?: { userId: string; email: string };
  }
}
