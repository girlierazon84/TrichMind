// client/src/providers/AuthProvider.tsx

"use client";

import React, {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { AxiosError } from "axios";
import {
    axiosClient,
    loggerApi,
    userApi,
    authApi,
    type LoginData,
    type RegisterData,
    type AuthResponse
} from "@/services";


/**-----------------------------
    Types
----------------------------*/
export interface AuthUser {
    id: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
}

type AuthStatus = "hydrating" | "authenticated" | "unauthenticated";

type AuthContextValue = {
    status: AuthStatus;
    user: AuthUser | null;
    token: string | null;
    loading: boolean;

    isAuthenticated: boolean;
    login: (data: LoginData) => Promise<AuthResponse>;
    register: (data: RegisterData) => Promise<AuthResponse>;
    logout: () => void;

    refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/** -----------------------------
 * SSR-safe localStorage helpers
 * ----------------------------*/
function safeGet(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}
function safeSet(key: string, value: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // ignore
    }
}
function safeRemove(key: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        // ignore
    }
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

type UserWire = Record<string, unknown> & {
    _id?: string;
    id?: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    avatar_url?: string;
};

function normalizeUser(raw: unknown): AuthUser {
    const obj = isRecord(raw) ? raw : {};
    const maybeUser = (isRecord(obj.user) ? obj.user : obj) as UserWire;

    const id =
        (typeof maybeUser._id === "string" && maybeUser._id) ||
        (typeof maybeUser.id === "string" && maybeUser.id) ||
        "";

    const email = (typeof maybeUser.email === "string" && maybeUser.email) || "";

    const avatarUrl =
        (typeof maybeUser.avatarUrl === "string" && maybeUser.avatarUrl) ||
        (typeof maybeUser.avatar_url === "string" && maybeUser.avatar_url) ||
        undefined;

    const displayName = typeof maybeUser.displayName === "string" ? maybeUser.displayName : undefined;

    return { id, email, displayName, avatarUrl };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("hydrating");
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // prevent repeated “session invalid” logs
    const didLogInvalidRef = useRef(false);

    const setAuthHeader = useCallback((jwt: string | null) => {
        if (jwt) {
            axiosClient.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
        } else {
            delete axiosClient.defaults.headers.common["Authorization"];
        }
    }, []);

    const clearAuth = useCallback(() => {
        safeRemove("access_token");
        safeRemove("refresh_token");
        safeRemove("user");
        setUser(null);
        setToken(null);
        setAuthHeader(null);
        setStatus("unauthenticated");
    }, [setAuthHeader]);

    const storeAuth = useCallback(
        (res: AuthResponse) => {
            safeSet("access_token", res.token);
            setToken(res.token);
            setAuthHeader(res.token);

            if (res.refreshToken) safeSet("refresh_token", res.refreshToken);

            const normalized = normalizeUser(res.user);
            setUser(normalized);
            safeSet("user", JSON.stringify(normalized));

            setStatus("authenticated");
            return normalized;
        },
        [setAuthHeader]
    );

    const hydrate = useCallback(async () => {
        const storedToken = safeGet("access_token");
        const storedUser = safeGet("user");

        if (!storedToken) {
            setStatus("unauthenticated");
            return;
        }

        setToken(storedToken);
        setAuthHeader(storedToken);

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser) as AuthUser);
            } catch {
                // ignore
            }
        }

        try {
            const profile = await authApi.me();
            const normalized = normalizeUser(profile);
            setUser(normalized);
            safeSet("user", JSON.stringify(normalized));
            setStatus("authenticated");
        } catch (err: unknown) {
            if (!didLogInvalidRef.current) {
                didLogInvalidRef.current = true;

                const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
                const msg =
                    axiosErr.response?.data?.message ||
                    axiosErr.response?.data?.error ||
                    (err instanceof Error ? err.message : "Auth failed");

                void loggerApi.warn("Auth session invalid — clearing session", { message: msg });
            }
            clearAuth();
        }
    }, [setAuthHeader, clearAuth]);

    useEffect(() => {
        void hydrate().finally(() => {
            setStatus((s) => (s === "hydrating" ? "unauthenticated" : s));
        });
    }, [hydrate]);

    const logout = useCallback(() => {
        void loggerApi.log({ level: "info", category: "auth", message: "User logged out" });
        clearAuth();
    }, [clearAuth]);

    const login = useCallback(
        async (data: LoginData) => {
            setLoading(true);
            try {
                const res = await authApi.login(data);
                storeAuth(res);
                return res;
            } finally {
                setLoading(false);
            }
        },
        [storeAuth]
    );

    const register = useCallback(
        async (data: RegisterData) => {
            setLoading(true);
            try {
                const res = await authApi.register(data);
                storeAuth(res);
                return res;
            } finally {
                setLoading(false);
            }
        },
        [storeAuth]
    );

    const refreshUser = useCallback(async () => {
        if (!token) return;

        try {
            const raw: unknown = await userApi.getProfile();
            // Accept either { ok:true, user:{...} } or a user object directly
            const normalized = normalizeUser(raw);
            if (normalized.id && normalized.email) {
                setUser(normalized);
                safeSet("user", JSON.stringify(normalized));
            }
        } catch {
            // ignore
        }
    }, [token]);

    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            user,
            token,
            loading,
            isAuthenticated: status === "authenticated" && !!user,
            login,
            register,
            logout,
            refreshUser,
        }),
        [status, user, token, loading, login, register, logout, refreshUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
