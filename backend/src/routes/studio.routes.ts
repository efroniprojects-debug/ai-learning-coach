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
  task: z.enum(['summary', 'practice']),
  sources: z.array(sourceSchema).min(1).max(10),
});

export async function studioRoutes(app: FastifyInstance) {
  app.post('/api/v1/studio/generate', { preHandler: authMiddleware }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const parsed = generateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'יש לבחור לפחות מקור לימוד אחד' });

    const materials: string[] = [];
    for (const source of parsed.data.sources) {
      try {
        let text = '';
        if (source.kind === 'drive') {
          if (!source.mimeType) continue;
          text = await DriveService.extractText(source.id, source.mimeType);
        } else {
          const [upload] = await db.select({ content: uploadedFiles.contentExtracted })
            .from(uploadedFiles)
            .where(and(eq(uploadedFiles.id, source.id), eq(uploadedFiles.userId, request.user.userId)))
            .limit(1);
          text = upload?.content ?? '';
        }
        if (text.trim()) materials.push(`--- ${source.name} ---\n${text.slice(0, 25_000)}`);
      } catch (sourceError) {
        app.log.warn({ sourceError, source: source.name }, 'Studio source extraction failed');
      }
    }
    if (materials.length === 0) return reply.status(400).send({ error: 'לא ניתן היה לקרוא טקסט מהמקורות שנבחרו' });

    const apiKey = process.env.DEMO_GEMINI_API_KEY;
    if (!apiKey) return reply.status(503).send({ error: 'מפתח Gemini אינו מוגדר' });
    const instruction = parsed.data.task === 'summary'
      ? 'צור סיכום לימודי מסודר בעברית. השתמש בכותרות, נקודות מפתח, נוסחאות והגדרות. אל תוסיף מידע שלא מופיע במקורות.'
      : 'צור 8 שאלות תרגול בעברית ברמות קושי עולות. לאחר כל שאלה הוסף רמז, ובסוף הוסף פתרונות מלאים תחת כותרת נפרדת.';
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
}
