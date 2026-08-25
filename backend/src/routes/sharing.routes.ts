import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '@/middleware/auth.middleware';
import { db, shareLinks } from '@/db';
import { eq, and } from 'drizzle-orm';

const generateLinkSchema = z.object({
  resourceType: z.enum(['question', 'solution', 'progress_report']),
  resourceId: z.string().min(1),
  expiresIn: z.number().optional(), // minutes
});

function generateShareId(): string {
  return Math.random().toString(36).substring(2, 14); // 12 char random ID
}

export async function sharingRoutes(app: FastifyInstance) {
  // POST /api/v1/share/generate-link
  app.post<{ Body: unknown }>(
    '/api/v1/share/generate-link',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const body = generateLinkSchema.parse(request.body);
        const shareId = generateShareId();
        const accessToken = uuidv4();
        const expiresAt = body.expiresIn
          ? new Date(Date.now() + body.expiresIn * 60 * 1000)
          : null;

        const [link] = await db
          .insert(shareLinks)
          .values({
            id: shareId,
            userId: request.user.userId,
            resourceType: body.resourceType,
            resourceId: body.resourceId as any,
            accessToken,
            expiresAt,
          })
          .returning();

        const shareUrl = `${process.env.FRONTEND_URL}/share/${shareId}`;
        reply.status(201).send({
          shareId,
          accessToken,
          shareUrl,
          expiresAt,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors[0].message });
        }
        const message = error instanceof Error ? error.message : 'Failed to generate link';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/share/:shareId (public, no auth)
  app.get(
    '/api/v1/share/:shareId',
    async (request: FastifyRequest<{ Params: { shareId: string } }>, reply: FastifyReply) => {
      try {
        const { shareId } = request.params;
        const accessToken = (request.headers['x-share-token'] as string) || '';

        const link = await db.query.shareLinks.findFirst({
          where: eq(shareLinks.id, shareId),
        });

        if (!link) return reply.status(404).send({ error: 'Share link not found' });
        if (!link.isActive) return reply.status(410).send({ error: 'Link expired or inactive' });
        if (link.expiresAt && link.expiresAt < new Date()) {
          return reply.status(410).send({ error: 'Link expired' });
        }
        if (link.accessToken !== accessToken) {
          return reply.status(403).send({ error: 'Invalid access token' });
        }

        // Increment view count
        await db
          .update(shareLinks)
          .set({ viewCount: (link.viewCount || 0) + 1 })
          .where(eq(shareLinks.id, shareId));

        // TODO: Return actual resource content based on resourceType
        // For now, return link metadata + mock content
        reply.status(200).send({
          resource: {
            type: link.resourceType,
            id: link.resourceId,
            content: 'Resource content here', // Mock
          },
          sharedBy: 'User Name', // TODO: Get from users table
          sharedAt: link.createdAt,
          viewCount: link.viewCount,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch shared resource';
        reply.status(400).send({ error: message });
      }
    }
  );

  // DELETE /api/v1/share/:shareId
  app.delete(
    '/api/v1/share/:shareId',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Params: { shareId: string } }>, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const { shareId } = request.params;
        const link = await db.query.shareLinks.findFirst({
          where: eq(shareLinks.id, shareId),
        });

        if (!link) return reply.status(404).send({ error: 'Link not found' });
        if (link.userId !== request.user.userId) {
          return reply.status(403).send({ error: 'Not owner of this link' });
        }

        await db.delete(shareLinks).where(eq(shareLinks.id, shareId));
        reply.status(204).send();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete link';
        reply.status(400).send({ error: message });
      }
    }
  );
}
