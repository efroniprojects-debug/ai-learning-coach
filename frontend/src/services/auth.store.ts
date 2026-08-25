import { create } from 'zustand';
import type { User } from '@/types/auth';
import { authService } from './auth.service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: () => Promise<void>;
  handleGoogleCallback: (code: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async () => {
    set({ isLoading: true, error: null });
    try {
      authService.initiateGoogleLogin();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
    }
  },

  handleGoogleCallback: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.handleGoogleCallback(code);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Authentication failed',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export const useAuth = useAuthStore;
