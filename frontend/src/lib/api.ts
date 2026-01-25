import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import type { ApiError, AuthResponse, TokenPair, User } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Token management
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    Cookies.set("access_token", token, { expires: 1 / 96 }); // 15 minutes
  } else {
    Cookies.remove("access_token");
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  return Cookies.get("access_token") || null;
}

export function clearTokens() {
  accessToken = null;
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

// Request interceptor to add auth header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try to refresh token
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as unknown as { _retry: boolean })._retry
    ) {
      (originalRequest as unknown as { _retry: boolean })._retry = true;

      try {
        const refreshToken = Cookies.get("refresh_token");
        if (refreshToken) {
          const response = await axios.post<TokenPair>(
            `${API_URL}/api/auth/refresh`,
            { refresh_token: refreshToken },
            { withCredentials: true }
          );

          setAccessToken(response.data.access_token);
          Cookies.set("refresh_token", response.data.refresh_token, { expires: 7 });

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  refreshToken: async (refreshToken: string): Promise<TokenPair> => {
    const response = await api.post<TokenPair>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  updateMe: async (data: { username?: string; settings?: Record<string, unknown> }): Promise<User> => {
    const response = await api.patch<User>("/auth/me", data);
    return response.data;
  },

  changePassword: async (data: {
    old_password: string;
    new_password: string;
  }): Promise<void> => {
    await api.post("/auth/password", data);
  },
};

// Documents API (placeholder - will be expanded in Phase 2)
export const documentsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }) => {
    const response = await api.get("/documents", { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
};

// Health check
export const systemApi = {
  health: async () => {
    const response = await api.get("/health");
    return response.data;
  },

  stats: async () => {
    const response = await api.get("/stats");
    return response.data;
  },
};

export default api;
