import axios from 'axios';
import { apiClient } from '@/services/api.client';

export const practiceApi = {
  selectProblem: async () => {
    const { data } = await apiClient.get('/api/v1/practice/select-problem');
    return data;
  },

  submitAttempt: async (conceptId: string, isCorrect: boolean, timeSpentSeconds: number) => {
    const { data } = await apiClient.post('/api/v1/practice/submit-attempt', {
      conceptId,
      isCorrect,
      timeSpentSeconds,
    });
    return data;
  },

  getHistory: async () => {
    const { data } = await apiClient.get('/api/v1/practice/history');
    return data.attempts;
  },

  getMasteryOverview: async () => {
    const { data } = await apiClient.get('/api/v1/practice/mastery-overview');
    return data;
  },

  getRecommendation: async () => {
    const { data } = await apiClient.get('/api/v1/practice/next-recommendation');
    return data;
  },
};
