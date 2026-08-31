import { apiClient } from '@/services/api.client';

export const progressApi = {
  getOverview: async () => {
    const { data } = await apiClient.get('/api/v1/progress/overview');
    return data;
  },

  getHistory: async () => {
    const { data } = await apiClient.get('/api/v1/progress/history');
    return data;
  },

  getMasteryLevels: async () => {
    const { data } = await apiClient.get('/api/v1/progress/mastery-levels');
    return data;
  },

  getStats: async () => {
    const { data } = await apiClient.get('/api/v1/progress/stats');
    return data;
  },

  getWeakAreas: async () => {
    const { data } = await apiClient.get('/api/v1/progress/weak-areas');
    return data;
  },

  getGaps: async () => {
    const { data } = await apiClient.get('/api/v1/progress/gaps');
    return data as {
      gaps: Array<{ topic: string; subtopic: string; elo: number; confidence: string }>;
      topics: Array<{ topic: string; elo: number; score: number }>;
      hasData: boolean;
    };
  },
};
