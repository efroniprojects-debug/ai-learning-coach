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

  // Ask Question endpoint (supports Claude, Gemini, OpenAI)
  app.post('/api/v1/questions/ask', async (request, reply) => {
    const { question, provider } = request.body as { question: string; provider?: 'claude' | 'gemini' | 'openai' };

    if (!question) {
      return reply.status(400).send({ error: 'Question is required' });
    }

    const detectedProvider = provider || 'claude';
    const systemPrompt = 'You are an expert physics tutor. Explain concepts clearly and provide step-by-step solutions. Respond in Hebrew.';

    try {
      if (detectedProvider === 'claude') {
        const apiKey = process.env.DEMO_CLAUDE_API_KEY;
        if (!apiKey) {
          return reply.status(400).send({ error: 'No Claude API key configured.' });
        }

        const { Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: question }],
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        return {
          content,
          provider: 'claude' as const,
          model: 'claude-3-5-sonnet-20241022',
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        };
      } else if (detectedProvider === 'gemini') {
        const apiKey = process.env.DEMO_GEMINI_API_KEY;
        if (!apiKey) {
          return reply.status(400).send({ error: 'No Gemini API key configured.' });
        }

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: 'gemini-1.5-pro' });

        const result = await model.generateContent(question);

        const content = result.response.text();
        return {
          content,
          provider: 'gemini' as const,
          model: 'gemini-1.5-pro',
          tokensUsed: 0,
        };
      } else if (detectedProvider === 'openai') {
        const apiKey = process.env.DEMO_OPENAI_API_KEY;
        if (!apiKey) {
          return reply.status(400).send({ error: 'No OpenAI API key configured.' });
        }

        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey });
        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
        });

        const content = response.choices[0].message.content || '';
        const inputTokens = response.usage?.prompt_tokens || 0;
        const outputTokens = response.usage?.completion_tokens || 0;
        return {
          content,
          provider: 'openai' as const,
          model: 'gpt-4o',
          tokensUsed: inputTokens + outputTokens,
        };
      }
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
