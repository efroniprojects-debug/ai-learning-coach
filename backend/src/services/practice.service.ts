import { db, skillMastery, practiceAttempts, progressSnapshots } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import { DEFAULT_SUBJECT_ID, getSubjectConfig } from '@/config/subjects';

/**
 * Practice Service
 *
 * Adaptive learning through spaced repetition + ELO ratings.
 * Similar to chess ratings, used in education (Duolingo, Khan Academy).
 */

const K_FACTOR = 32; // How much ratings change per attempt (higher = more volatile)
const INITIAL_ELO = 1000;
const MASTERY_THRESHOLDS = {
  novice: 1000,
  intermediate: 1300,
  proficient: 1500,
  expert: 1700,
};

export class PracticeService {
  /**
   * Get or create user's mastery record for a concept
   */
  static async getOrCreateMastery(userId: string, conceptId: string, subjectId: string = DEFAULT_SUBJECT_ID) {
    getSubjectConfig(subjectId);
    let mastery = await db.query.skillMastery.findFirst({
      where: and(
        eq(skillMastery.userId, userId),
        eq(skillMastery.subjectId, subjectId),
        eq(skillMastery.conceptId, conceptId)
      ),
    });

    if (!mastery) {
      const [newMastery] = await db
        .insert(skillMastery)
        .values({
          userId,
          subjectId,
          conceptId,
          eloRating: INITIAL_ELO,
          attemptsCount: 0,
          correctAttempts: 0,
          confidenceLevel: 'novice',
        })
        .returning();

      mastery = newMastery;
    }

    return mastery;
  }

  /**
   * Select next problem based on adaptive difficulty
   *
   * Strategy:
   * 1. Identify weak concepts (ELO < 1300)
   * 2. Prioritize weak areas (80% of time)
   * 3. 20% of time: practice stronger areas (maintain)
   * 4. Adapt difficulty based on recent performance
   */
  static async selectNextProblem(userId: string, subjectId: string = DEFAULT_SUBJECT_ID) {
    getSubjectConfig(subjectId);
    // Get user's mastery levels
    const allMastery = await db.query.skillMastery.findMany({
      where: and(eq(skillMastery.userId, userId), eq(skillMastery.subjectId, subjectId)),
    });

    const weakConcepts = allMastery.filter((m) => (m.eloRating ?? 1000) < 1300);
    const strongConcepts = allMastery.filter((m) => (m.eloRating ?? 1000) >= 1300);

    // Select concept
    const shouldPracticeWeak = Math.random() < 0.8; // 80% weak, 20% strong
    const selectedMastery = shouldPracticeWeak
      ? weakConcepts[Math.floor(Math.random() * Math.max(1, weakConcepts.length))] ||
        strongConcepts[0]
      : strongConcepts[Math.floor(Math.random() * Math.max(1, strongConcepts.length))] ||
        weakConcepts[0];

    if (!selectedMastery) {
      throw new Error('No concepts to practice');
    }

    return {
      conceptId: selectedMastery.conceptId,
      difficulty: this.calculateDifficulty(selectedMastery.eloRating ?? 1000),
      eloRating: selectedMastery.eloRating ?? 1000,
    };
  }

  /**
   * Calculate problem difficulty (1-5) based on ELO
   */
  private static calculateDifficulty(eloRating: number): number {
    if (eloRating < 1100) return 1; // Easy
    if (eloRating < 1300) return 2; // Medium-Easy
    if (eloRating < 1500) return 3; // Medium
    if (eloRating < 1700) return 4; // Medium-Hard
    return 5; // Hard
  }

  /**
   * Submit attempt and update ELO
   */
  static async submitAttempt(
    userId: string,
    conceptId: string,
    isCorrect: boolean,
    timeSpentSeconds: number,
    subjectId: string = DEFAULT_SUBJECT_ID
  ) {
    // Get current mastery
    const mastery = await this.getOrCreateMastery(userId, conceptId, subjectId);

    const currentElo = mastery.eloRating ?? 1000;
    const eloChange = this.calculateEloChange(currentElo, isCorrect);
    const newElo = Math.max(800, currentElo + eloChange);

    const [updated] = await db
      .update(skillMastery)
      .set({
        eloRating: newElo,
        attemptsCount: (mastery.attemptsCount ?? 0) + 1,
        correctAttempts: (mastery.correctAttempts ?? 0) + (isCorrect ? 1 : 0),
        lastAttemptedAt: new Date(),
        confidenceLevel: this.getConfidenceLevel(newElo),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(skillMastery.userId, userId),
          eq(skillMastery.subjectId, subjectId),
          eq(skillMastery.conceptId, conceptId)
        )
      )
      .returning();

    await db.insert(practiceAttempts).values({
      userId,
      subjectId,
      questionId: conceptId,
      isCorrect,
      score: isCorrect ? 100 : Math.max(0, 50 - timeSpentSeconds / 10),
      timeSpentSeconds,
      feedback: isCorrect ? '✓ Correct!' : '✗ Try again or get a hint.',
    });

    // Update progress snapshot
    await this.updateProgressSnapshot(userId, subjectId);

    return {
      eloChange,
      newElo,
      confidenceLevel: updated.confidenceLevel,
      mastered: newElo >= MASTERY_THRESHOLDS.proficient,
    };
  }

  /**
   * Calculate ELO change (simple formula)
   *
   * If correct: +K_FACTOR / (1 + difficulty_multiplier)
   * If wrong: -K_FACTOR
   */
  private static calculateEloChange(currentElo: number, isCorrect: boolean): number {
    if (!isCorrect) {
      return -K_FACTOR;
    }

    // Reward based on current rating (beat the odds if highly rated)
    if (currentElo < 1200) return K_FACTOR * 0.8; // Easy win
    if (currentElo < 1400) return K_FACTOR * 0.6; // Normal win
    if (currentElo < 1600) return K_FACTOR * 0.4; // Good win
    return K_FACTOR * 0.2; // Expert win
  }

  /**
   * Get confidence level from ELO
   */
  private static getConfidenceLevel(elo: number): string {
    if (elo >= MASTERY_THRESHOLDS.expert) return 'expert';
    if (elo >= MASTERY_THRESHOLDS.proficient) return 'proficient';
    if (elo >= MASTERY_THRESHOLDS.intermediate) return 'intermediate';
    return 'novice';
  }

  /**
   * Update daily progress snapshot
   */
  private static async updateProgressSnapshot(userId: string, subjectId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allMastery = await db.query.skillMastery.findMany({
      where: and(eq(skillMastery.userId, userId), eq(skillMastery.subjectId, subjectId)),
    });

    const masteryLevels: Record<string, number | undefined> = {};
    const weakAreas: string[] = [];

    for (const m of allMastery) {
      masteryLevels[m.conceptId] = m.eloRating ?? 1000;
      if ((m.eloRating ?? 1000) < 1200) {
        weakAreas.push(m.conceptId);
      }
    }

    // Get today's attempts
    const todayAttempts = await db.query.practiceAttempts.findMany({
      where: and(
        eq(practiceAttempts.userId, userId),
        eq(practiceAttempts.subjectId, subjectId),
        eq(practiceAttempts.createdAt, today)
      ),
    });

    const correctToday = todayAttempts.filter((a) => a.isCorrect).length;
    const timeSpentToday = todayAttempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);

    // Upsert snapshot
    const existing = await db.query.progressSnapshots.findFirst({
      where: and(
        eq(progressSnapshots.userId, userId),
        eq(progressSnapshots.subjectId, subjectId),
        eq(progressSnapshots.date, today)
      ),
    });

    if (existing) {
      await db
        .update(progressSnapshots)
        .set({
          masteryLevels,
          attemptsToday: todayAttempts.length,
          problemsSolved: correctToday,
          timeSpentSeconds: timeSpentToday,
          weakAreas,
        })
        .where(eq(progressSnapshots.id, existing.id));
    } else {
      await db.insert(progressSnapshots).values({
        userId,
        subjectId,
        date: today,
        masteryLevels,
        attemptsToday: todayAttempts.length,
        problemsSolved: correctToday,
        timeSpentSeconds: timeSpentToday,
        weakAreas,
      });
    }
  }

  /**
   * Get user's practice history
   */
  static async getPracticeHistory(userId: string, limit: number = 20, subjectId: string = DEFAULT_SUBJECT_ID) {
    getSubjectConfig(subjectId);
    const attempts = await db.query.practiceAttempts.findMany({
      where: and(eq(practiceAttempts.userId, userId), eq(practiceAttempts.subjectId, subjectId)),
      orderBy: [desc(practiceAttempts.createdAt)],
      limit,
    });

    return attempts;
  }

  /**
   * Get user's mastery overview
   */
  static async getMasteryOverview(userId: string, subjectId: string = DEFAULT_SUBJECT_ID) {
    getSubjectConfig(subjectId);
    const allMastery = await db.query.skillMastery.findMany({
      where: and(eq(skillMastery.userId, userId), eq(skillMastery.subjectId, subjectId)),
    });

    const overview = {
      novice: allMastery.filter((m) => (m.eloRating ?? 1000) < 1200).length,
      intermediate: allMastery.filter((m) => (m.eloRating ?? 1000) >= 1200 && (m.eloRating ?? 1000) < 1400).length,
      proficient: allMastery.filter((m) => (m.eloRating ?? 1000) >= 1400 && (m.eloRating ?? 1000) < 1600).length,
      expert: allMastery.filter((m) => (m.eloRating ?? 1000) >= 1600).length,
    };

    return {
      totalConcepts: allMastery.length,
      distribution: overview,
      averageElo: allMastery.length > 0 ?
        Math.round(allMastery.reduce((sum: number, m) => sum + (m.eloRating ?? 1000), 0) / allMastery.length) :
        0,
      masteryList: allMastery.sort((a, b) => (b.eloRating ?? 1000) - (a.eloRating ?? 1000)),
    };
  }

  /**
   * Get next recommendation
   */
  static async getRecommendation(userId: string, subjectId: string = DEFAULT_SUBJECT_ID) {
    const mastery = await this.getMasteryOverview(userId, subjectId);

    if (mastery.masteryList.length === 0) {
      return {
        recommendation: 'Start by practicing basics!',
        conceptId: null,
        reason: 'No practice history yet',
      };
    }

    // Find weakest concept
    const weakest = mastery.masteryList[mastery.masteryList.length - 1];

    return {
      recommendation: `Practice "${weakest.conceptId}" to improve`,
      conceptId: weakest.conceptId,
      reason: `Current ELO: ${weakest.eloRating} (${weakest.confidenceLevel})`,
    };
  }
}
