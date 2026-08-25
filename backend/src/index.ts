import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from '@/routes/auth.routes';
import { aiSettingsRoutes } from '@/routes/ai-settings.routes';
import { questionRoutes } from '@/routes/question.routes';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

async function startServer() {
  const app = Fastify({
    logger: true,
  });

  // Register plugins
  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  await app.register(jwt, {
    secret: JWT_SECRET,
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // Register routes
  await authRoutes(app);
  await aiSettingsRoutes(app);
  await questionRoutes(app);

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    console.error(error);
    reply.status(500).send({ error: 'Internal server error' });
  });

  try {
    await app.listen({ host: HOST, port: PORT });
    console.log(`Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

startServer();
