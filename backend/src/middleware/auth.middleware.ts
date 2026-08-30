// Auth removed — open access, no authentication required
import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';

// Inject a fixed local user so routes that use request.user still work
export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  request.user = { userId: 'local-user-00000000', email: 'user@physiq.local' };
  done();
}

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    user?: { userId: string; email: string };
  }
}
