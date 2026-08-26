import Fastify from 'fastify';
import cors from '@fastify/cors';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = '0.0.0.0';

async function startServer() {
  const app = Fastify({ logger: true });

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ai-learning-coach-cyan.vercel.app',
    'https://ai-learning-coach-production.up.railway.app',
  ];

  await app.register(cors, { origin: allowedOrigins, credentials: true });

  // ─── Health ───────────────────────────────────────────────────────────────
  app.get('/', async () => ({
    name: 'AI Learning Coach Backend',
    version: '0.3.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  }));

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // ─── Detect available capabilities ───────────────────────────────────────
  let dbAvailable = false;
  let jwtAvailable = false;
  let encryptionAvailable = false;

  try {
    const { db, users } = await import('@/db');
    // Actually test the connection, not just module load
    await db.select({ id: users.id }).from(users).limit(1);
    dbAvailable = true;
  } catch (e) {
    app.log.warn('Database not available: ' + (e instanceof Error ? e.message : String(e)));
  }

  try {
    const { JWTService } = await import('@/services/jwt.service');
    JWTService.generateAccessToken({ userId: 'test', email: 'test' }); // validate secrets exist
    jwtAvailable = true;
  } catch (e) {
    app.log.warn('JWT not available: ' + (e instanceof Error ? e.message : String(e)));
  }

  try {
    const { EncryptionService } = await import('@/services/encryption.service');
    EncryptionService.encrypt('test');
    encryptionAvailable = true;
  } catch (e) {
    app.log.warn('Encryption not available: ' + (e instanceof Error ? e.message : String(e)));
  }

  app.log.info(`Capabilities — DB:${dbAvailable} JWT:${jwtAvailable} Encryption:${encryptionAvailable}`);

  // ─── Auth: Demo Login ─────────────────────────────────────────────────────
  // Allows testing without Google OAuth. Creates a real user in DB + issues JWT.
  app.post('/api/v1/auth/demo-login', async (request, reply) => {
    if (!jwtAvailable) {
      return reply.status(503).send({ error: 'JWT not configured. Set JWT_SECRET and JWT_REFRESH_SECRET.' });
    }

    const { email } = (request.body as any) || {};
    const demoEmail = (email as string) || 'demo@ai-learning-coach.com';

    try {
      const { JWTService } = await import('@/services/jwt.service');

      let userId: string;
      let displayName: string;

      if (dbAvailable) {
        const { db, users } = await import('@/db');
        const { eq } = await import('drizzle-orm');

        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, demoEmail))
          .limit(1);

        let user = existingUser;

        if (!user) {
          const [newUser] = await db
            .insert(users)
            .values({ email: demoEmail, displayName: 'Demo User' })
            .returning();
          user = newUser;
        }

        userId = user.id;
        displayName = user.displayName || 'Demo User';
      } else {
        userId = 'demo-00000000-0000-0000-0000-000000000001';
        displayName = 'Demo User (no DB)';
      }

      const accessToken = JWTService.generateAccessToken({ userId, email: demoEmail });
      const refreshToken = JWTService.generateRefreshToken({ userId, email: demoEmail });

      return reply.status(200).send({
        user: { id: userId, email: demoEmail, displayName },
        tokens: { accessToken, refreshToken, expiresIn: 900 },
      });
    } catch (err) {
      app.log.error({ err }, 'Demo login failed');
      return reply.status(500).send({ error: err instanceof Error ? err.message : 'Demo login failed' });
    }
  });

  // ─── Auth: Verify JWT ─────────────────────────────────────────────────────
  app.get('/api/v1/auth/verify', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing authorization header' });
    }

    if (!jwtAvailable) {
      return reply.status(503).send({ error: 'JWT not configured' });
    }

    try {
      const { JWTService } = await import('@/services/jwt.service');
      const payload = JWTService.verifyAccessToken(authHeader.substring(7));

      if (dbAvailable) {
        const { db, users } = await import('@/db');
        const { eq } = await import('drizzle-orm');
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
        if (user) {
          return reply.status(200).send({
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            profilePicture: user.profilePicture,
            language: user.language,
            theme: user.theme,
            focusModeEnabled: user.focusModeEnabled,
            createdAt: user.createdAt?.toISOString(),
            updatedAt: user.updatedAt?.toISOString(),
          });
        }
      }

      return reply.status(200).send({ id: payload.userId, email: payload.email, displayName: 'User' });
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }
  });

  // ─── Auth: Google OAuth (only if credentials configured) ──────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
    const { authRoutes } = await import('./routes/auth.routes');
    await app.register(authRoutes);
    app.log.info('Google OAuth routes registered');
  } else {
    app.post('/api/v1/auth/google/callback', async (_req, reply) => {
      reply.status(503).send({ error: 'Google OAuth not configured. Use /api/v1/auth/demo-login.' });
    });
  }

  // ─── Auth: Logout ─────────────────────────────────────────────────────────
  app.post('/api/v1/auth/logout', async (_req, reply) => {
    reply.status(200).send({ success: true });
  });

  // ─── Auth: Refresh (minimal - returns same token) ─────────────────────────
  app.post('/api/v1/auth/refresh', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ') || !jwtAvailable) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    try {
      const { JWTService } = await import('@/services/jwt.service');
      const payload = JWTService.verifyAccessToken(authHeader.substring(7));
      const newToken = JWTService.generateAccessToken({ userId: payload.userId, email: payload.email });
      return reply.status(200).send({ accessToken: newToken, expiresIn: 900 });
    } catch {
      return reply.status(401).send({ error: 'Invalid token' });
    }
  });

  // ─── AI Settings (BYOK) ───────────────────────────────────────────────────
  if (dbAvailable && jwtAvailable && encryptionAvailable) {
    const { aiSettingsRoutes } = await import('./routes/ai-settings.routes');
    await app.register(aiSettingsRoutes);
    app.log.info('AI Settings routes registered (BYOK enabled)');
  } else {
    // Minimal mocks so frontend doesn't crash
    app.get('/api/v1/ai-settings/configs', async (_req, reply) => reply.send([]));
    app.post('/api/v1/ai-settings/save', async (request, reply) => {
      const { provider, model } = (request.body as any) || {};
      return reply.send({ id: `mock-${Date.now()}`, provider, model, isActive: false });
    });
    app.post('/api/v1/ai-settings/:configId/activate', async (_req, reply) => reply.send({ success: true }));
    app.delete('/api/v1/ai-settings/:configId', async (_req, reply) => reply.send({ success: true }));
    app.log.warn('AI Settings using mocks (BYOK disabled - check DB/JWT/Encryption config)');
  }

  // ─── Legacy AI provider routes (backward compat) ──────────────────────────
  app.get('/api/v1/ai/providers', async (_req, reply) => reply.send([]));
  app.post('/api/v1/ai/providers', async (request, reply) => {
    const { provider, model } = (request.body as any) || {};
    return reply.send({ id: `mock-${Date.now()}`, provider, model, isActive: true, createdAt: new Date().toISOString() });
  });
  app.put('/api/v1/ai/providers/:id/activate', async (_req, reply) => reply.send({ success: true }));
  app.delete('/api/v1/ai/providers/:id', async (_req, reply) => reply.send({ success: true }));

  // ─── Practice / Progress mocks ────────────────────────────────────────────
  app.get('/api/v1/practice/select-problem', async (_req, reply) =>
    reply.send({ conceptId: 'Force', difficulty: 3, eloRating: 1200 })
  );
  app.get('/api/v1/progress/overview', async (_req, reply) =>
    reply.send({
      today: { attemptCount: 0, problemsSolved: 0, timeSpentSeconds: 0 },
      mastery: { totalConcepts: 0, distribution: { novice: 0, intermediate: 0, proficient: 0, expert: 0 }, averageElo: 0 },
    })
  );

  // ─── Ask Question (Multi-provider, BYOK-aware) ────────────────────────────
  app.post('/api/v1/questions/ask', async (request, reply) => {
    const body = request.body as { question?: string; text?: string; provider?: string };
    const question = body.question || body.text; // accept both field names

    if (!question) {
      return reply.status(400).send({ error: 'Question is required' });
    }

    const provider = (body.provider || 'gemini') as 'claude' | 'gemini' | 'openai';
    const systemPrompt =
      'You are an expert physics tutor for Israeli high school students (grades 10-12). ' +
      'Explain concepts clearly using the Socratic method. Start with intuition, then steps. ' +
      'Always respond in Hebrew. Cite sources when available.';

    // Resolve API key: BYOK first, then demo key
    let apiKey: string | null = null;

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ') && dbAvailable && jwtAvailable && encryptionAvailable) {
      try {
        const { JWTService } = await import('@/services/jwt.service');
        const payload = JWTService.verifyAccessToken(authHeader.substring(7));
        const { AISettingsService } = await import('@/services/ai-settings.service');
        const config = await AISettingsService.getActiveConfig(payload.userId);
        if (config.provider === provider) {
          apiKey = config.apiKey;
          app.log.info(`Using BYOK key for ${provider}`);
        }
      } catch {
        // No BYOK key for this provider, fall through to demo
      }
    }

    if (!apiKey) {
      const envKey = `DEMO_${provider.toUpperCase()}_API_KEY`;
      apiKey = process.env[envKey] || null;
      if (apiKey) app.log.info(`Using demo key for ${provider}`);
    }

    if (!apiKey) {
      return reply.status(400).send({
        error: `No API key configured for ${provider}. Please add your API key in Settings, or ask the admin to configure DEMO_${provider.toUpperCase()}_API_KEY.`,
      });
    }

    try {
      if (provider === 'claude') {
        const { Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: 'user', content: question }],
        });
        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        return reply.send({
          content,
          provider: 'claude',
          model: 'claude-3-5-sonnet-20241022',
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        });

      } else if (provider === 'gemini') {
        const modelName = 'gemini-1.0-pro';
        const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nשאלה: ${question}` }] }],
          }),
        });
        if (!res.ok) {
          const errData = (await res.json()) as { error?: { message?: string } };
          throw new Error(errData.error?.message || `Gemini API error: ${res.status}`);
        }
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return reply.send({ content, provider: 'gemini', model: modelName, tokensUsed: 0 });

      } else if (provider === 'openai') {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey });
        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 1500,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
        });
        const content = response.choices[0].message.content || '';
        return reply.send({
          content,
          provider: 'openai',
          model: 'gpt-4o',
          tokensUsed: (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI provider error';
      return reply.status(500).send({ error: message });
    }
  });

  // ─── Error handler ────────────────────────────────────────────────────────
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    reply.status(500).send({ error: 'Internal server error' });
  });

  try {
    await app.listen({ host: HOST, port: PORT });
    console.log(`\n✅ Backend v0.3.0 running at http://${HOST}:${PORT}`);
    console.log(`   DB: ${dbAvailable ? '✅' : '❌'}  JWT: ${jwtAvailable ? '✅' : '❌'}  Encryption: ${encryptionAvailable ? '✅' : '❌'}`);
    console.log(`   Demo Login: /api/v1/auth/demo-login`);
    console.log(`   Health: /health\n`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

startServer();
