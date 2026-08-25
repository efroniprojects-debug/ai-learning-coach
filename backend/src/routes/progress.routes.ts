import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '@/middleware/auth.middleware';
import { db, progressSnapshots, skillMastery, practiceAttempts } from '@/db';
import { eq, desc, and, gte } from 'drizzle-orm';

export async function progressRoutes(app: FastifyInstance) {
  // GET /api/v1/progress/overview
  app.get(
    '/api/v1/progress/overview',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get today's snapshot
        const snapshot = await db.query.progressSnapshots.findFirst({
          where: and(
            eq(progressSnapshots.userId, request.user.userId),
            eq(progressSnapshots.date, today)
          ),
        });

        // Get mastery distribution
        const allMastery = await db.query.skillMastery.findMany({
          where: eq(skillMastery.userId, request.user.userId),
        });

        const distribution = {
          novice: allMastery.filter((m) => (m.eloRating ?? 1000) < 1200).length,
          intermediate: allMastery.filter((m) => (m.eloRating ?? 1000) >= 1200 && (m.eloRating ?? 1000) < 1400).length,
          proficient: allMastery.filter((m) => (m.eloRating ?? 1000) >= 1400 && (m.eloRating ?? 1000) < 1600).length,
          expert: allMastery.filter((m) => (m.eloRating ?? 1000) >= 1600).length,
        };

        const totalConcepts = allMastery.length;
        const averageElo =
          totalConcepts > 0
            ? Math.round(allMastery.reduce((sum: number, m) => sum + (m.eloRating ?? 1000), 0) / totalConcepts)
            : 0;

        reply.status(200).send({
          today: {
            attemptCount: snapshot?.attemptsToday || 0,
            problemsSolved: snapshot?.problemsSolved || 0,
            timeSpentSeconds: snapshot?.timeSpentSeconds || 0,
          },
          mastery: {
            totalConcepts,
            distribution,
            averageElo,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get progress overview';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/progress/history
  app.get(
    '/api/v1/progress/history',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        // Get last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const history = await db.query.progressSnapshots.findMany({
          where: and(
            eq(progressSnapshots.userId, request.user.userId),
            gte(progressSnapshots.date, thirtyDaysAgo)
          ),
          orderBy: [desc(progressSnapshots.date)],
        });

        reply.status(200).send({
          snapshots: history.map((snapshot) => ({
            date: snapshot.date,
            attemptCount: snapshot.attemptsToday || 0,
            problemsSolved: snapshot.problemsSolved || 0,
            timeSpentSeconds: snapshot.timeSpentSeconds || 0,
            weakAreas: snapshot.weakAreas || [],
          })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get history';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/progress/mastery-levels
  app.get(
    '/api/v1/progress/mastery-levels',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const allMastery = await db.query.skillMastery.findMany({
          where: eq(skillMastery.userId, request.user.userId),
          orderBy: [desc(skillMastery.eloRating)],
        });

        reply.status(200).send({
          concepts: allMastery.map((m) => ({
            conceptId: m.conceptId,
            eloRating: m.eloRating || 1000,
            confidenceLevel: m.confidenceLevel,
            attemptsCount: m.attemptsCount || 0,
            correctAttempts: (m.correctAttempts || 0),
            successRate: (m.attemptsCount || 0) ? ((m.correctAttempts || 0) / (m.attemptsCount || 1)) * 100 : 0,
            lastAttemptedAt: m.lastAttemptedAt,
          })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get mastery levels';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/progress/weak-areas
  app.get(
    '/api/v1/progress/weak-areas',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        const weakMastery = await db.query.skillMastery.findMany({
          where: eq(skillMastery.userId, request.user.userId),
          orderBy: [skillMastery.eloRating],
          limit: 5,
        });

        reply.status(200).send({
          weakAreas: weakMastery.map((m) => ({
            conceptId: m.conceptId,
            eloRating: m.eloRating,
            recommendedToStudy: true,
          })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get weak areas';
        reply.status(400).send({ error: message });
      }
    }
  );

  // GET /api/v1/progress/stats
  app.get(
    '/api/v1/progress/stats',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

        // Get all-time stats
        const allAttempts = await db.query.practiceAttempts.findMany({
          where: eq(practiceAttempts.userId, request.user.userId),
        });

        const totalAttempts = allAttempts.length;
        const correctAttempts = allAttempts.filter((a) => a.isCorrect).length;
        const totalTimeSpent = allAttempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);
        const avgScore = allAttempts.length
          ? Math.round(
              allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length
            )
          : 0;

        reply.status(200).send({
          stats: {
            totalAttempts,
            correctAttempts,
            accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
            totalTimeSpentSeconds: totalTimeSpent,
            averageScore: avgScore,
            totalHoursSpent: Math.round(totalTimeSpent / 3600),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get stats';
        reply.status(400).send({ error: message });
      }
    }
  );
}
