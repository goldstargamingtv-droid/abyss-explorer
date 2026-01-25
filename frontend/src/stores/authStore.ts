import { create } from "zustand";
import Cookies from "js-cookie";
import { authApi, setAccessToken, clearTokens, getAccessToken } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: { username?: string; settings?: Record<string, unknown> }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    const token = getAccessToken();

    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Token is invalid, clear it
      clearTokens();
      set({ isLoading: false, isAuthenticated: false, user: null });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.login({ email, password });

      // Store tokens
      setAccessToken(response.tokens.access_token);
      Cookies.set("refresh_token", response.tokens.refresh_token, { expires: 7 });

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      set({
        error: error.response?.data?.detail || "Login failed",
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (email: string, username: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authApi.register({ email, username, password });

      // Store tokens
      setAccessToken(response.tokens.access_token);
      Cookies.set("refresh_token", response.tokens.refresh_token, { expires: 7 });

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      set({
        error: error.response?.data?.detail || "Registration failed",
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  updateUser: async (data) => {
    try {
      const user = await authApi.updateMe(data);
      set({ user });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      set({ error: error.response?.data?.detail || "Update failed" });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
