// Auth removed — open access
// This file kept for import compatibility only

const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

import axios from 'axios';
import type { AIProviderConfig } from '@/types/auth';

const api = axios.create({ baseURL: API_URL });

class AuthService {
  initiateGoogleLogin() { window.location.href = '/dashboard'; }

  async demoLogin(_email?: string) {
    return { user: { id: 'local-user', email: 'user@physiq.local', displayName: 'Sharon' }, tokens: { accessToken: '', refreshToken: '', expiresIn: 0 } };
  }

  async handleGoogleCallback(_code: string) {
    return { user: { id: 'local-user', email: 'user@physiq.local', displayName: 'Sharon' }, tokens: { accessToken: '', refreshToken: '', expiresIn: 0 } };
  }

  async getCurrentUser() {
    return { id: 'local-user', email: 'user@physiq.local', displayName: 'Sharon' };
  }

  async logout() {}

  async getAIProviderConfigs(): Promise<AIProviderConfig[]> {
    try {
      const { data } = await api.get<AIProviderConfig[]>('/api/v1/ai-settings/configs');
      return data;
    } catch { return []; }
  }

  async saveAIProviderConfig(config: { provider: string; model: string; apiKey: string }) {
    const { data } = await api.post('/api/v1/ai-settings/save', config);
    return data;
  }

  async activateAIProviderConfig(configId: string) {
    await api.post(`/api/v1/ai-settings/${configId}/activate`);
  }

  async deleteAIProviderConfig(configId: string) {
    await api.delete(`/api/v1/ai-settings/${configId}`);
  }

  setTokens(_tokens: unknown) {}
  clearLocalTokens() {}
}

export const authService = new AuthService();
