import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db, uploadedFiles } from '@/db';
import { authMiddleware } from '@/middleware/auth.middleware';
import { DriveService } from '@/services/drive.service';

const sourceSchema = z.object({
  kind: z.enum(['drive', 'upload']),
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  mimeType: z.string().optional(),
});

const generateSchema = z.object({
  subjectId: z.string().optional().default('physics'),
  task: z.enum(['summary', 'practice']),
  sources: z.array(sourceSchema).min(1).max(10),
});

export async function studioRoutes(app: FastifyInstance) {
  const loadMaterials = async (
    sources: z.infer<typeof sourceSchema>[],
    userId: string,
    subjectId: string,
    onProgress?: (completed: number, total: number, name: string) => void,
  ): Promise<string[]> => {
    const materials: string[] = [];
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
          if (source.mimeType && allowedDriveFile) text = await DriveService.extractText(source.id, source.mimeType);
        } else {
          const [upload] = await db.select({ content: uploadedFiles.contentExtracted })
            .from(uploadedFiles)
            .where(and(
              eq(uploadedFiles.id, source.id),
              eq(uploadedFiles.userId, userId),
              eq(uploadedFiles.subjectId, subjectId)
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

    const materials = await loadMaterials(parsed.data.sources, request.user.userId, parsed.data.subjectId);
    if (materials.length === 0) return reply.status(400).send({ error: 'לא ניתן היה לקרוא טקסט מהמקורות שנבחרו' });

    const apiKey = process.env.DEMO_GEMINI_API_KEY;
    if (!apiKey) return reply.status(503).send({ error: 'מפתח Gemini אינו מוגדר' });
    const instruction = instructionFor(parsed.data.task);
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${instruction}\n\n${materials.join('\n\n').slice(0, 80_000)}` }] }],
        generationConfig: { temperature: 0.35 },
      }),
    });
    const data = await response.json() as { error?: { message?: string }; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    if (!response.ok) return reply.status(502).send({ error: data.error?.message ?? 'יצירת התוכן נכשלה' });
    const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
    if (!content) return reply.status(502).send({ error: 'לא התקבל תוכן מ־Gemini' });
    return reply.send({ content, task: parsed.data.task, sourcesUsed: materials.length });
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
    const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, 90_000);
    // The response socket reflects the live SSE connection; the incoming
    // request itself may close normally as soon as its body has been read.
    reply.raw.on('close', () => { clientDisconnected = true; controller.abort(); });
    try {
      sendEvent({ type: 'status', stage: 'sources_started' });
      const materials = await loadMaterials(parsed.data.sources, request.user.userId, parsed.data.subjectId, (completed, total, name) => {
        sendEvent({ type: 'status', stage: 'source_completed', completed, total, name });
      });
      if (materials.length === 0) throw new Error('לא ניתן היה לקרוא טקסט מהמקורות שנבחרו');
      const apiKey = process.env.DEMO_GEMINI_API_KEY;
      if (!apiKey) throw new Error('שירות יצירת התוכן אינו מוגדר כרגע');

      sendEvent({ type: 'status', stage: 'gemini_started', sourcesUsed: materials.length });
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${instructionFor(parsed.data.task)}\n\n${materials.join('\n\n').slice(0, 80_000)}` }] }],
          generationConfig: { temperature: 0.35 },
        }),
      });
      if (!response.ok || !response.body) throw new Error('יצירת התוכן נכשלה');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          const chunk = JSON.parse(raw) as { error?: { message?: string }; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
          if (chunk.error?.message) throw new Error(chunk.error.message);
          const delta = chunk.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
          if (delta) { content += delta; sendEvent({ type: 'delta', text: delta }); }
        }
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
      if (!reply.raw.writableEnded) reply.raw.end();
    }
  });
}
