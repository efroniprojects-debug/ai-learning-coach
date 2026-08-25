import Fastify from 'fastify';
import cors from '@fastify/cors';
import { AIGateway } from './ai/AIGateway';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = '0.0.0.0';

async function startServer() {
  const app = Fastify({
    logger: true,
  });

  // Register CORS plugin
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ai-learning-coach-cyan.vercel.app',
    'https://ai-learning-coach-production.up.railway.app',
  ];

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });

  // Root endpoint
  app.get('/', async () => {
    return {
      name: 'AI Learning Coach Backend',
      version: '0.1.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      docs: '/api/docs',
      health: '/health'
    };
  });

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Mock API endpoints for frontend to work
  app.get('/api/v1/auth/verify', async (request, reply) => {
    return {
      isAuthenticated: false,
      message: 'Backend running. Database not connected.'
    };
  });

  app.post('/api/v1/auth/google/callback', async (request, reply) => {
    reply.status(501).send({ error: 'Database not configured. Setup production deployment for full functionality.' });
  });

  app.get('/api/v1/practice/select-problem', async (request, reply) => {
    return {
      conceptId: 'Force',
      difficulty: 3,
      eloRating: 1200
    };
  });

  app.get('/api/v1/progress/overview', async (request, reply) => {
    return {
      today: { attemptCount: 0, problemsSolved: 0, timeSpentSeconds: 0 },
      mastery: { totalConcepts: 0, distribution: { novice: 0, intermediate: 0, proficient: 0, expert: 0 }, averageElo: 0 }
    };
  });

  app.post('/api/v1/questions/ask', async (request, reply) => {
    reply.status(501).send({ error: 'Database not configured. Setup production deployment for full functionality.' });
  });

  // AI Provider Config endpoints (mock for now)
  app.get('/api/v1/ai/providers', async (request, reply) => {
    return [];
  });

  app.post('/api/v1/ai/providers', async (request, reply) => {
    const { provider, model, apiKey } = request.body as any;
    return {
      id: `config_${Date.now()}`,
      provider,
      model,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  });

  app.put('/api/v1/ai/providers/:id/activate', async (request, reply) => {
    return { success: true };
  });

  app.delete('/api/v1/ai/providers/:id', async (request, reply) => {
    return { success: true };
  });

  // Ask Question endpoint
  app.post('/api/v1/questions/ask', async (request, reply) => {
    const { question, context } = request.body as { question: string; context?: string };

    if (!question) {
      return reply.status(400).send({ error: 'Question is required' });
    }

    // For now, use a demo provider (in production, load from database)
    const demoProvider = {
      name: 'claude' as const,
      apiKey: process.env.DEMO_CLAUDE_API_KEY || '',
      model: 'claude-3-5-sonnet-20241022',
    };

    if (!demoProvider.apiKey) {
      return reply.status(400).send({
        error: 'No AI provider configured. Please add your API key in Settings.',
      });
    }

    try {
      const gateway = new AIGateway(demoProvider);
      const response = await gateway.ask(question, context);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get response from AI';
      return reply.status(500).send({ error: message });
    }
  });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    console.error(error);
    reply.status(500).send({ error: 'Internal server error' });
  });

  try {
    await app.listen({ host: HOST, port: PORT });
    console.log(`✅ Backend running at http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔗 Frontend: http://localhost:5173`);
    console.log(`\n⚠️  Database not connected. For full functionality:`);
    console.log(`   → Read: DEPLOYMENT_GUIDE.md`);
    console.log(`   → Setup Supabase + configure DATABASE_URL`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

startServer();
