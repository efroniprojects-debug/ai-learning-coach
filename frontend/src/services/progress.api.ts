import { apiClient } from '@/services/api.client';

export interface MasteryDistribution {
  novice: number;
  intermediate: number;
  proficient: number;
  expert: number;
}

export interface ProgressOverview {
  today: { attemptCount: number; problemsSolved: number; timeSpentSeconds: number };
  mastery: { distribution: MasteryDistribution };
}

export interface ProgressSnapshot {
  date: string;
  attemptCount: number;
  problemsSolved: number;
  timeSpentSeconds: number;
  weakAreas: string[];
}

export interface ConceptMastery {
  conceptId: string;
  eloRating: number;
  confidenceLevel: string;
  successRate: number;
  attemptsCount: number;
}

export interface ProgressStats {
  totalAttempts: number;
  accuracy: number;
  averageScore: number;
  totalHoursSpent: number;
  correctAttempts: number;
}

export const progressApi = {
  getOverview: async (subjectId: string) => {
    const { data } = await apiClient.get('/api/v1/progress/overview', { params: { subjectId } });
    return data as ProgressOverview;
  },

  getHistory: async (subjectId: string) => {
    const { data } = await apiClient.get('/api/v1/progress/history', { params: { subjectId } });
    return data as { snapshots: ProgressSnapshot[] };
  },

  getMasteryLevels: async (subjectId: string) => {
    const { data } = await apiClient.get('/api/v1/progress/mastery-levels', { params: { subjectId } });
    return data as { concepts: ConceptMastery[] };
  },

  getStats: async (subjectId: string) => {
    const { data } = await apiClient.get('/api/v1/progress/stats', { params: { subjectId } });
    return data as { stats: ProgressStats };
  },

  getWeakAreas: async (subjectId: string) => {
    const { data } = await apiClient.get('/api/v1/progress/weak-areas', { params: { subjectId } });
    return data;
  },

  getGaps: async (subjectId: string) => {
    const { data } = await apiClient.get('/api/v1/progress/gaps', { params: { subjectId } });
    return data as {
      gaps: Array<{ topic: string; subtopic: string; elo: number; confidence: string }>;
      topics: Array<{ topic: string; elo: number; score: number }>;
      hasData: boolean;
    };
  },
};
