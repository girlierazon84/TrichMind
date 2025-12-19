// client/src/services/axiosClient.ts

import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

/**-------------------------------------------------------------------
    Backend ROOT (WITHOUT trailing /api).

    🔹 In dev (Vite):  VITE_API_BASE_URL = "http://localhost:8080"
    🔹 In prod (Vercel): falls back to Render API if not set
----------------------------------------------------------------------*/
const API_ROOT =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://trichmind-api.onrender.com"
    : "http://localhost:8080");

// Normalize and append `/api`
const baseURL = `${API_ROOT.replace(/\/+$/, "")}/api`;

// Extend Axios request config to include our internal flags
type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _retryCount?: number;
};

// Shape of error payload from backend
export interface ErrorResponseBody {
  error?: string;
  message?: string;
  mongoReadyState?: number;
}

/** Axios error "code" type without using `any` */
type AxiosErrorWithCode<T = unknown> = AxiosError<T> & { code?: string };

/** --- small helpers --- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isRetryable(error: AxiosError<ErrorResponseBody>) {
  const status = error.response?.status;

  // Server says "not ready" (our requireMongo 503)
  if (status === 503) return true;

  // Gateway/proxy hiccups
  if (status === 502 || status === 504) return true;

  // Axios network / timeout (Render cold start / mobile)
  const code = (error as AxiosErrorWithCode<ErrorResponseBody>).code;
  if (code === "ECONNABORTED") return true; // timeout
  if (error.message?.toLowerCase().includes("network error")) return true;

  return false;
}

// Axios Client – always points at /api
export const axiosClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 30000, // 30s
});

// Attach access token to requests
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponseBody>) => {
    const original = error.config as RetriableRequestConfig | undefined;

    /** 1) Retry once on cold-start / DB not ready / transient network */
    if (original && isRetryable(error)) {
      const count = original._retryCount ?? 0;
      if (count < 1) {
        original._retryCount = count + 1;
        await sleep(700);
        return axiosClient(original);
      }
    }

    /** 2) Handle expired token and retry once */
    if (
      error.response?.status === 401 &&
      error.response.data?.error === "Token expired" &&
      original &&
      !original._retry
    ) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Request new access token (direct axios, not axiosClient)
        const refresh = await axios.post<{ token?: string }>(
          `${baseURL}/auth/refresh`,
          { token: refreshToken },
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
            timeout: 20000,
          }
        );

        const newToken = refresh.data.token;

        if (!newToken) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        localStorage.setItem("access_token", newToken);
        axiosClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;

        return axiosClient(original);
      } catch (err) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
