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
};
