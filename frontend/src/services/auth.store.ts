// Auth removed — open access
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; displayName: string } | null;
  login: () => void;
  logout: () => void;
  fetchUser: () => void;
  demoLogin: () => void;
  clearError: () => void;
  error: null;
}

export const useAuthStore = create<AuthState>(() => ({
  isAuthenticated: true,
  isLoading: false,
  error: null,
  user: { id: 'local-user', email: 'user@physiq.local', displayName: 'Sharon' },
  login: () => {},
  logout: () => {},
  fetchUser: () => {},
  demoLogin: () => {},
  clearError: () => {},
}));

export const useAuth = useAuthStore;
