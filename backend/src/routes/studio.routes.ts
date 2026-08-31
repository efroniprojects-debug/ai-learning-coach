import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db, driveTextCache, uploadedFiles } from '@/db';
import { authMiddleware } from '@/middleware/auth.middleware';
import { DriveService } from '@/services/drive.service';
import { AIGateway } from '@/ai/gateway';
import { normalizeStudyUnits } from '@/config/subjects';

const sourceSchema = z.object({
  kind: z.enum(['drive', 'upload']),
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  mimeType: z.string().optional(),
});

const generateSchema = z.object({
  subjectId: z.string().optional().default('physics'),
  studyUnits: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
  task: z.enum(['summary', 'practice']),
  sources: z.array(sourceSchema).min(1).max(10),
});

export async function studioRoutes(app: FastifyInstance) {
  const createGateway = async (userId: string): Promise<AIGateway> => {
    const gateway = new AIGateway();
    try {
      await gateway.initializeForUser(userId);
    } catch (configurationError) {
      // Keep the current demo deployment compatible while preferring the
      // user's encrypted provider configuration whenever one exists.
      const demoKey = process.env.DEMO_GEMINI_API_KEY;
      if (!demoKey) throw configurationError;
      gateway.initializeWithProvider('gemini', demoKey, process.env.DEMO_GEMINI_MODEL ?? 'gemini-3.6-flash');
    }
    return gateway;
  };
  const loadMaterials = async (
    sources: z.infer<typeof sourceSchema>[],
    userId: string,
    subjectId: string,
    studyUnits?: number,
    onProgress?: (completed: number, total: number, name: string) => void,
  ): Promise<string[]> => {
    const materials: string[] = [];
    const normalizedUnits = normalizeStudyUnits(subjectId, studyUnits);
    // Resolve the selected subject folder once, then reject Drive IDs from
    // other subjects before any extraction takes place.
    const allowedDriveFiles = sources.some((source) => source.kind === 'drive')
      ? await DriveService.listFiles(subjectId)
      : [];
    for (const [index, source] of sources.entries()) {
      try {
        let text = '';
        if (source.kind === 'drive') {
          const allowedDriveFile = allowedDriveFiles.find((file) => file.id === source.id);
          if (source.mimeType && allowedDriveFile) {
            let cached: typeof driveTextCache.$inferSelect | undefined;
            try {
              cached = await db.query.driveTextCache.findFirst({
                where: and(eq(driveTextCache.fileId, source.id), eq(driveTextCache.subjectId, subjectId)),
              });
            } catch (cacheReadError) {
              // Cache availability must never prevent the source itself from
              // being used during a rolling deployment or transient DB issue.
              app.log.warn({ cacheReadError, source: source.name }, 'Studio cache read failed');
            }
            const sourceModifiedAt = allowedDriveFile.modifiedTime ? new Date(allowedDriveFile.modifiedTime) : null;
            if (cached
              && (sourceModifiedAt === null || cached.sourceModifiedAt?.getTime() === sourceModifiedAt.getTime())) {
              text = cached.extractedText;
            } else {
              text = await DriveService.extractText(source.id, source.mimeType);
              if (text.trim()) {
                try {
                  await db.insert(driveTextCache).values({
                    fileId: source.id,
                    subjectId,
                    mimeType: source.mimeType,
                    sourceModifiedAt,
                    extractedText: text,
                    updatedAt: new Date(),
                  }).onConflictDoUpdate({
                    target: driveTextCache.fileId,
                    set: { subjectId, mimeType: source.mimeType, sourceModifiedAt, extractedText: text, updatedAt: new Date() },
                  });
                } catch (cacheWriteError) {
                  app.log.warn({ cacheWriteError, source: source.name }, 'Studio cache write failed');
                }
              }
            }
          }
        } else {
          const [upload] = await db.select({ content: uploadedFiles.contentExtracted })
            .from(uploadedFiles)
            .where(and(
              eq(uploadedFiles.id, source.id),
              eq(uploadedFiles.userId, userId),
              eq(uploadedFiles.subjectId, subjectId),
              eq(uploadedFiles.studyUnits, normalizedUnits)
            ))
            .limit(1);
          text = upload?.content ?? '';
        }
        if (text.trim()) materials.push(`--- ${source.name} ---\n${text.slice(0, 25_000)}`);
      } catch (sourceError) {
        app.log.warn({ sourceError, source: source.name }, 'Studio source extraction failed');
      }
      onProgress?.(index + 1, sources.length, source.name);
    }
    return materials;
  };

  const instructionFor = (task: 'summary' | 'practice') => task === 'summary'
    ? 'צור סיכום לימודי מסודר בעברית. השתמש בכותרות, נקודות מפתח, נוסחאות והגדרות. אל תוסיף מידע שלא מופיע במקורות.'
    : 'צור 8 שאלות תרגול בעברית ברמות קושי עולות. לאחר כל שאלה הוסף רמז, ובסוף הוסף פתרונות מלאים תחת כותרת נפרדת.';

  app.post('/api/v1/studio/generate', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const parsed = generateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'יש לבחור לפחות מקור לימוד אחד' });

    const materials = await loadMaterials(parsed.data.sources, request.user.userId, parsed.data.subjectId, parsed.data.studyUnits);
    if (materials.length === 0) return reply.status(400).send({ error: 'לא ניתן היה לקרוא טקסט מהמקורות שנבחרו' });

    const instruction = instructionFor(parsed.data.task);
    const gateway = await createGateway(request.user.userId);
    const response = await gateway.generateResponse({
      messages: [{ role: 'user', content: `${instruction}\n\n${materials.join('\n\n').slice(0, 80_000)}` }],
      temperature: 0.35,
      signal: AbortSignal.timeout(170_000),
    });
    return reply.send({ content: response.content, task: parsed.data.task, sourcesUsed: materials.length });
  });

  app.post('/api/v1/studio/generate/stream', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const parsed = generateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'יש לבחור לפחות מקור לימוד אחד' });

    reply.hijack();
    reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no');
    reply.raw.flushHeaders();
    const sendEvent = (data: object) => {
      if (!reply.raw.destroyed && !reply.raw.writableEnded) reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const controller = new AbortController();
    let timedOut = false;
    let clientDisconnected = false;
    const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, 170_000);
    // Some PDFs need time for extraction. A heartbeat prevents proxies from
    // treating the otherwise healthy SSE connection as idle between sources.
    const heartbeatId = setInterval(() => sendEvent({ type: 'heartbeat' }), 10_000);
    // The response socket reflects the live SSE connection; the incoming
    // request itself may close normally as soon as its body has been read.
    reply.raw.on('close', () => { clientDisconnected = true; controller.abort(); });
    try {
      sendEvent({ type: 'status', stage: 'sources_started' });
      const materials = await loadMaterials(parsed.data.sources, request.user.userId, parsed.data.subjectId, parsed.data.studyUnits, (completed, total, name) => {
        sendEvent({ type: 'status', stage: 'source_completed', completed, total, name });
      });
      if (materials.length === 0) throw new Error('לא ניתן היה לקרוא טקסט מהמקורות שנבחרו');
      const gateway = await createGateway(request.user.userId);
      sendEvent({ type: 'status', stage: 'ai_started', sourcesUsed: materials.length });
      const stream = gateway.generateStream({
        messages: [{ role: 'user', content: `${instructionFor(parsed.data.task)}\n\n${materials.join('\n\n').slice(0, 80_000)}` }],
        temperature: 0.35,
        signal: controller.signal,
      });
      let content = '';
      for await (const chunk of stream) {
        content += chunk.delta;
        sendEvent({ type: 'delta', text: chunk.delta });
      }
      if (!content.trim()) throw new Error('לא התקבל תוכן משירות היצירה');
      sendEvent({ type: 'done', content: content.trim(), task: parsed.data.task, sourcesUsed: materials.length });
    } catch (error) {
      if (!clientDisconnected) sendEvent({
        type: 'error',
        message: timedOut
          ? 'יצירת התוכן ארכה יותר מדי. אפשר לנסות שוב עם אותם מקורות.'
          : error instanceof Error ? error.message : 'יצירת התוכן נכשלה',
      });
    } finally {
      clearTimeout(timeoutId);
      clearInterval(heartbeatId);
      if (!reply.raw.writableEnded) reply.raw.end();
    }
  });
}
