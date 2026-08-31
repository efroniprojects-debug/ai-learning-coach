import type { FastifyInstance } from 'fastify';

import { DriveService } from '@/services/drive.service';

export async function driveRoutes(app: FastifyInstance) {
  app.get('/api/v1/drive/files', async (request, reply) => {
    const subjectId = (request.query as { subjectId?: string }).subjectId ?? 'physics';
    if (!DriveService.isConfigured(subjectId)) {
      return reply.send({ configured: false, files: [], lastSyncAt: null });
    }
    try {
      return reply.send({
        configured: true,
        files: await DriveService.listFiles(subjectId),
        lastSyncAt: DriveService.getLastSyncAt(subjectId),
      });
    } catch (error) {
      app.log.warn({ error }, 'Drive file listing failed');
      return reply.status(502).send({ error: 'לא ניתן לקרוא את תיקיית Google Drive כרגע' });
    }
  });

  app.post('/api/v1/drive/sync', async (request, reply) => {
    const subjectId = (request.query as { subjectId?: string }).subjectId ?? 'physics';
    if (!DriveService.isConfigured(subjectId)) {
      return reply.status(503).send({ error: 'Google Drive לא מחובר' });
    }
    try {
      return reply.send(await DriveService.syncFolder(subjectId));
    } catch (error) {
      app.log.warn({ error }, 'Drive sync failed');
      return reply.status(502).send({ error: 'סנכרון Google Drive נכשל' });
    }
  });
}
