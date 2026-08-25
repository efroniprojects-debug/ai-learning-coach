export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  language: 'he' | 'en';
  theme: 'light' | 'dark' | 'auto';
  focusModeEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AIProvider {
  id: string;
  name: 'claude' | 'gemini' | 'openai';
  displayName: string;
  models: string[];
}

export interface AIProviderConfig {
  id: string;
  provider: 'claude' | 'gemini' | 'openai';
  model: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // apiKeyEncrypted is never returned to client
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface GoogleAuthResponse {
  code: string;
  scope: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}
