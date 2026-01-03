// client/src/services/axiosClient.ts

"use client";

import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
    type Method,
} from "axios";


/**----------------------------------
    ✅ Next.js client-side Axios
-------------------------------------*/
const API_ROOT_FROM_ENV =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_ROOT ||
    process.env.NEXT_PUBLIC_API_URL ||
    "";

const DEFAULT_DEV_ROOT = "http://localhost:8080";

export const API_ROOT =
    API_ROOT_FROM_ENV.trim() ||
    (typeof window !== "undefined" ? DEFAULT_DEV_ROOT : "");

export const baseURL = API_ROOT ? `${API_ROOT.replace(/\/+$/, "")}/api` : "/api";

/**------------------------------------------------------------------
    ✅ axiosRaw: NO interceptors (use for /logs, /auth/refresh)
    - IMPORTANT: Do NOT auto-attach Authorization here.
---------------------------------------------------------------------*/
export const axiosRaw = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
    timeout: 20000,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
    _retryCount?: number;
};

export interface ErrorResponseBody {
    ok?: boolean;
    error?: string;
    message?: string;
    mongoReadyState?: number;
}

type AxiosErrorWithCode<T = unknown> = AxiosError<T> & { code?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isSafeToRetry(method?: Method) {
    const m = (method || "GET").toUpperCase();
    return m === "GET" || m === "HEAD" || m === "OPTIONS";
}

export function isRetryable(error: AxiosError<ErrorResponseBody>) {
    const status = error.response?.status;
    if (status === 503 || status === 502 || status === 504) return true;

    const code = (error as AxiosErrorWithCode<ErrorResponseBody>).code;
    if (code === "ECONNABORTED") return true;
    if (code === "ERR_NETWORK") return true;

    const msg = (error.message || "").toLowerCase();
    if (msg.includes("network error")) return true;
    if (msg.includes("load failed")) return true;
    if (msg.includes("failed to fetch")) return true;
    if (msg.includes("timeout")) return true;

    return false;
}

function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem("access_token");
    } catch {
        return null;
    }
}

function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem("refresh_token");
    } catch {
        return null;
    }
}

function clearTokens() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem("access_token");
        window.localStorage.removeItem("refresh_token");
    } catch { }
}

function redirectToLogin() {
    if (typeof window === "undefined") return;
    window.location.href = "/login";
}

function isTokenExpiredResponse(error: AxiosError<ErrorResponseBody>) {
    if (error.response?.status !== 401) return false;
    const msg = (error.response.data?.message || "").toLowerCase();
    const err = (error.response.data?.error || "").toLowerCase();
    return msg.includes("token expired") || err.includes("token expired");
}

/**-------------------------------------------------------------
    ✅ axiosClient: interceptors enabled (app APIs)
----------------------------------------------------------------*/
export const axiosClient = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
    timeout: 30000,
});

axiosClient.interceptors.request.use((config) => {
    const token = getAccessToken();
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

        // 1) Retry once on transient failures
        if (original && isRetryable(error)) {
            const count = original._retryCount ?? 0;
            if (count < 1) {
                const method = original.method as Method | undefined;
                const status = error.response?.status;
                const allowRetry =
                    isSafeToRetry(method) || status === 502 || status === 503 || status === 504;

                if (allowRetry) {
                    original._retryCount = count + 1;
                    await sleep(700);
                    return axiosClient(original);
                }
            }
        }

        // 2) Refresh token once
        if (original && !original._retry && isTokenExpiredResponse(error)) {
            original._retry = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    clearTokens();
                    redirectToLogin();
                    return Promise.reject(error);
                }

                // Use axiosRaw to avoid interceptor loops
                const refresh = await axiosRaw.post<{ ok?: boolean; token?: string }>(
                    "/auth/refresh",
                    { token: refreshToken }
                );

                const newToken = refresh.data.token;
                if (!newToken) {
                    clearTokens();
                    redirectToLogin();
                    return Promise.reject(error);
                }

                if (typeof window !== "undefined") {
                    window.localStorage.setItem("access_token", newToken);
                }

                axiosClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
                original.headers = original.headers ?? {};
                original.headers.Authorization = `Bearer ${newToken}`;

                return axiosClient(original);
            } catch (err) {
                clearTokens();
                redirectToLogin();
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
