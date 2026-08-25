import Fastify from 'fastify';
import cors from '@fastify/cors';
import { aiGateway } from './ai/gateway';

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

  // Ask Question endpoint (demo - uses hardcoded Claude API key)
  app.post('/api/v1/questions/ask', async (request, reply) => {
    const { question } = request.body as { question: string };

    if (!question) {
      return reply.status(400).send({ error: 'Question is required' });
    }

    const apiKey = process.env.DEMO_CLAUDE_API_KEY;
    if (!apiKey) {
      return reply.status(400).send({
        error: 'No AI provider configured. Set DEMO_CLAUDE_API_KEY environment variable.',
      });
    }

    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: 'You are an expert physics tutor. Explain concepts clearly and provide step-by-step solutions. Respond in Hebrew.',
        messages: [{ role: 'user', content: question }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      return {
        content,
        provider: 'claude' as const,
        model: 'claude-3-5-sonnet-20241022',
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
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
