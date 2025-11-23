// client/src/services/axiosClient.ts

import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

// Base URL (backend root, WITHOUT /api)
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Extend Axios request config to include our internal flag
type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// Shape of error payload from backend
interface ErrorResponseBody {
  error?: string;
}

// Axios Client
export const axiosClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 10000,
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

// Handle expired token
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponseBody>) => {
    const original = error.config as RetriableRequestConfig | undefined;

    // Check for token expiration and retry once
    if (
      error.response?.status === 401 &&
      error.response.data?.error === "Token expired" &&
      original &&
      !original._retry
    ) {
      original._retry = true;

      // Request new access token
      try {
        const refreshToken = localStorage.getItem("refresh_token");

        // No refresh token, redirect to login
        if (!refreshToken) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Request new access token
        const refresh = await axios.post<{ token?: string }>(
          `${baseURL}/api/auth/refresh`,
          { token: refreshToken },
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );

        // Extract new access token from response
        const newToken = refresh.data.token;

        // No new token, redirect to login
        if (!newToken) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Store new token and update headers
        localStorage.setItem("access_token", newToken);
        axiosClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;

        // Retry original request with new token
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
