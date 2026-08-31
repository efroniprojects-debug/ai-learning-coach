import Fastify from 'fastify';
import cors from '@fastify/cors';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = '0.0.0.0';

async function startServer() {
  // Base64 attachments are ~33% larger than their source files.
  const app = Fastify({ logger: true, bodyLimit: 12 * 1024 * 1024 });

  // Open CORS — allow all origins for cross-device access (phone, tablet, desktop)
  await app.register(cors, {
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type'],
  });

  // ─── Health ───────────────────────────────────────────────────────────────
  app.get('/', async () => ({
    name: 'SmarterAI Backend',
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
    const { sql } = await import('drizzle-orm');
    // Test the connection with a timeout so slow DB doesn't delay startup
    await Promise.race([
      db.select({ id: users.id }).from(users).limit(1),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout')), 5000)),
    ]);
    await db.insert(users).values({
      id: '00000000-0000-4000-8000-000000000001',
      email: 'physiq-local-user@local.invalid',
      displayName: 'SmarterAI Student',
    }).onConflictDoNothing();
    // Idempotent Sprint 10 schema upgrade. Existing conversations remain
    // unfiled and deleting a folder never deletes its conversations.
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS conversation_folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL,
        CONSTRAINT conversation_folders_user_name_unique UNIQUE (user_id, name)
      );
    `));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS conversation_folders_user_id_idx ON conversation_folders(user_id)'));
    await db.execute(sql.raw('ALTER TABLE conversations ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES conversation_folders(id) ON DELETE SET NULL'));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS conversations_folder_id_idx ON conversations(folder_id)'));
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

  // ─── Auth: Google OAuth ───────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
    const { authRoutes } = await import('./routes/auth.routes');
    await app.register(authRoutes);
    app.log.info('Google OAuth routes registered');
  } else {
    // Fallback routes when Google OAuth is not configured
    app.post('/api/v1/auth/google/callback', async (_req, reply) => {
      reply.status(503).send({ error: 'Google OAuth not configured. Use /api/v1/auth/demo-login.' });
    });
    app.get('/api/v1/auth/verify', async (_req, reply) => {
      // Auth removed — always return local user
      return reply.status(200).send({ id: '00000000-0000-4000-8000-000000000001', email: 'physiq-local-user@local.invalid', displayName: 'SmarterAI Student' });
    });
    app.post('/api/v1/auth/logout', async (_req, reply) => {
      reply.status(200).send({ success: true });
    });
    app.post('/api/v1/auth/refresh', async (_req, reply) => {
      return reply.status(200).send({ accessToken: 'no-auth', expiresIn: 99999 });
    });
  }

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

  // ─── Uploads + Google Drive ─────────────────────────────────────────────
  if (dbAvailable) {
    const { uploadRoutes } = await import('./routes/upload.routes');
    await app.register(uploadRoutes);
    const { studioRoutes } = await import('./routes/studio.routes');
    await app.register(studioRoutes);
  }
  const { driveRoutes } = await import('./routes/drive.routes');
  await app.register(driveRoutes);

  if (dbAvailable && process.env.GOOGLE_SERVICE_ACCOUNT_JSON && (process.env.GOOGLE_DRIVE_PHYSICS_EXAMS_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID)) {
    const { DriveService } = await import('./services/drive.service');
    void DriveService.syncFolder().catch((error) => app.log.warn({ error }, 'Initial Drive sync failed'));
    const driveSyncTimer = setInterval(() => {
      void DriveService.syncFolder().catch((error) => app.log.warn({ error }, 'Scheduled Drive sync failed'));
    }, 30 * 60 * 1000);
    driveSyncTimer.unref();
  }


  // ─── Question Routes (stream endpoint + RAG) ────────────────────────────
  if (dbAvailable) {
    try {
      const { questionRoutes } = await import('./routes/question.routes');
      await app.register(questionRoutes);
      app.log.info('Question routes registered (/stream + /ask with RAG)');
    } catch (e) {
      app.log.warn('Question routes failed to register: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  // ─── Physics Topics & PhET Simulations ───────────────────────────────────
  app.get('/api/v1/physics/topics', async (_req, reply) => {
    const { PHYSICS_TOPIC_TAXONOMY } = await import('@/config/subjects');
    return reply.send(PHYSICS_TOPIC_TAXONOMY);
  });

  app.get('/api/v1/physics/phet', async (request, reply) => {
    const { subtopic } = (request.query as { subtopic?: string });
    const { PHET_SIMULATIONS } = await import('@/config/subjects');
    if (!subtopic) return reply.send(PHET_SIMULATIONS);
    return reply.send(PHET_SIMULATIONS[subtopic] ?? []);
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
