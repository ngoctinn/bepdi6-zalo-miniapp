import { ApiResponse } from "../types/api.types";
import { ApiError } from "./api-error";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api/v1" : "/api/v1");

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  idempotencyKey?: string;
}

import {
  nativeStorageGet,
  nativeStorageSet,
  nativeStorageRemove,
} from "./storage";

export const TOKEN_STORAGE_KEY = "bepdi6_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "bepdi6_refresh_token";

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export const getStoredToken = (): string | null => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      inMemoryAccessToken = token;
      return token;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
};

export const getStoredRefreshToken = (): string | null => {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;
  try {
    const token = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (token) {
      inMemoryRefreshToken = token;
      return token;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
};

export const setStoredTokens = (access: string, refresh?: string): void => {
  inMemoryAccessToken = access;
  if (refresh) {
    inMemoryRefreshToken = refresh;
  }
  // Synchronously update localStorage
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, access);
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refresh);
    }
  } catch {
    // Ignore localStorage errors
  }
  // Asynchronously persist to native ZMP storage
  void nativeStorageSet(TOKEN_STORAGE_KEY, access);
  if (refresh) {
    void nativeStorageSet(REFRESH_TOKEN_STORAGE_KEY, refresh);
  }
};

export const clearStoredTokens = (): void => {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }
  void nativeStorageRemove(TOKEN_STORAGE_KEY);
  void nativeStorageRemove(REFRESH_TOKEN_STORAGE_KEY);
};

/**
 * Hydrates tokens from native storage if missing in localStorage/in-memory
 */
export async function initStoredTokens(): Promise<void> {
  if (!inMemoryAccessToken) {
    const nativeAccess = await nativeStorageGet(TOKEN_STORAGE_KEY);
    if (nativeAccess) {
      inMemoryAccessToken = nativeAccess;
    }
  }
  if (!inMemoryRefreshToken) {
    const nativeRefresh = await nativeStorageGet(REFRESH_TOKEN_STORAGE_KEY);
    if (nativeRefresh) {
      inMemoryRefreshToken = nativeRefresh;
    }
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, idempotencyKey, headers = {}, ...customConfig } = options;

  let url = `${BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const token = getStoredToken();
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "69420",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    ...(headers as Record<string, string>),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s default timeout (NEW-10)

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: requestHeaders,
      signal: customConfig.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    // Handle HTTP No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Auto-clear invalid tokens on 401 to prevent authorization deadlock
    if (response.status === 401) {
      clearStoredTokens();
      if (typeof window !== "undefined" && !endpoint.includes("auth/zalo")) {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }

    let result: ApiResponse<T>;
    try {
      result = await response.json();
    } catch {
      throw new ApiError(
        "PARSE_ERROR",
        "Không thể đọc dữ liệu phản hồi từ máy chủ",
        response.status,
      );
    }

    // Backend Envelope checking: { success: true, data: ... } or { success: false, error: ... }
    if (result && typeof result === "object" && "success" in result) {
      if (result.success) {
        return result.data;
      } else {
        throw new ApiError(
          result.error?.code || "API_ERROR",
          result.error?.message || "Đã có lỗi xảy ra",
          response.status,
          result.error?.details,
        );
      }
    }

    // Direct data without envelope fallback (if any)
    if (!response.ok) {
      throw new ApiError(
        "HTTP_ERROR",
        `Lỗi kết nối máy chủ (${response.status})`,
        response.status,
      );
    }

    return result as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Lỗi kết nối mạng",
      0,
    );
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};
