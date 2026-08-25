import { apiClient } from '@/services/api.client';

export const shareApi = {
  generateLink: async (
    resourceType: 'question' | 'solution' | 'progress_report',
    resourceId: string,
    expiresIn?: number
  ) => {
    const { data } = await apiClient.post('/api/v1/share/generate-link', {
      resourceType,
      resourceId,
      expiresIn,
    });
    return data;
  },

  getSharedResource: async (shareId: string, accessToken: string) => {
    const { data } = await apiClient.get(`/api/v1/share/${shareId}`, {
      headers: {
        'X-Share-Token': accessToken,
      },
    });
    return data;
  },

  deleteLink: async (shareId: string) => {
    await apiClient.delete(`/api/v1/share/${shareId}`);
  },
};
