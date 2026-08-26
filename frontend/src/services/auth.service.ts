import axios, { AxiosInstance } from 'axios';
import type { User, AuthTokens, LoginResponse, AIProviderConfig } from '@/types/auth';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    });

    // Add token to headers
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const { data } = await this.api.post<AuthTokens>('/api/v1/auth/refresh');
            localStorage.setItem('accessToken', data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return this.api(originalRequest);
          } catch {
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Demo login (no Google OAuth required)
   */
  async demoLogin(email?: string): Promise<LoginResponse> {
    const { data } = await this.api.post<LoginResponse>('/api/v1/auth/demo-login', { email });
    this.setTokens(data.tokens);
    return data;
  }

  /**
   * Initiate Google OAuth login
   */
  initiateGoogleLogin(): void {
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const responseType = 'code';

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: responseType,
      scope,
      access_type: 'offline',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(code: string): Promise<LoginResponse> {
    const { data } = await this.api.post<LoginResponse>('/api/v1/auth/google/callback', {
      code,
    });

    this.setTokens(data.tokens);
    return data;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await this.api.get<User>('/api/v1/auth/verify');
    return data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthTokens> {
    const { data } = await this.api.post<AuthTokens>('/api/v1/auth/refresh');
    this.setTokens(data);
    return data;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Save tokens to storage
   */
  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get AI provider configs
   */
  async getAIProviderConfigs(): Promise<AIProviderConfig[]> {
    const { data } = await this.api.get<AIProviderConfig[]>('/api/v1/ai/providers');
    return data;
  }

  /**
   * Save AI provider config
   */
  async saveAIProviderConfig(
    provider: 'claude' | 'gemini' | 'openai',
    model: string,
    apiKey: string
  ): Promise<AIProviderConfig> {
    const { data } = await this.api.post<AIProviderConfig>('/api/v1/ai/providers', {
      provider,
      model,
      apiKey,
    });
    return data;
  }

  /**
   * Set active AI provider
   */
  async setActiveAIProvider(configId: string): Promise<AIProviderConfig> {
    const { data } = await this.api.put<AIProviderConfig>(
      `/api/v1/ai/providers/${configId}/activate`
    );
    return data;
  }

  /**
   * Delete AI provider config
   */
  async deleteAIProviderConfig(configId: string): Promise<void> {
    await this.api.delete(`/api/v1/ai/providers/${configId}`);
  }
}

export const authService = new AuthService();
