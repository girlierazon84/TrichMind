// client/src/providers/AuthProvider.tsx
// Fix authVersionRef to avoid login, refresh, login again behavior.

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

function safeSet(key: string, value: string): void {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(key, value);
    } catch {
        // ignore - Storage may be unavailable.
    }
}

function safeRemove(key: string): void {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.removeItem(key);
    } catch {
        // ignore - Storage may be unavailable.
    }
}

/**-------------------------------
    User normalization helpers
----------------------------------*/
function isRecord(
    v: unknown
): v is Record<string, unknown> {
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

    const maybeUser = (
        isRecord(obj.user) ? obj.user : obj
    ) as UserWire;

    const id =
        (typeof maybeUser._id === "string" && maybeUser._id) ||
        (typeof maybeUser.id === "string" && maybeUser.id) ||
        "";

    const email = (typeof maybeUser.email === "string" && maybeUser.email) || "";

    const displayName = typeof maybeUser.displayName === "string" ? maybeUser.displayName : undefined;

    const avatarUrl =
        (typeof maybeUser.avatarUrl === "string" && maybeUser.avatarUrl) ||
        (typeof maybeUser.avatar_url === "string" && maybeUser.avatar_url) ||
        undefined;

    return {
        id,
        email,
        displayName,
        avatarUrl
    };
}

/**-----------------
    AuthProvider
--------------------*/
export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [status, setStatus] = useState<AuthStatus>("hydrating");
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    /**--------------------------------------------------------------
        Every new authentication operation increments this value.
        This prevents an older /auth/me hydration request from
        clearing a newly created login session.
    -----------------------------------------------------------------*/
    const authVersionRef = useRef(0);

    /**--------------------------------------------
        Prevent repeated “session invalid” logs
    -----------------------------------------------*/
    const didLogInvalidRef = useRef(false);

    const setAuthHeader = useCallback(
        (jwt: string | null) => {
            if (jwt) {
                axiosClient.defaults.headers.common.Authorization = `Bearer ${jwt}`;
            } else {
                delete axiosClient.defaults.headers.common.Authorization;
            }
        },
        []
    );

    const clearAuth = useCallback(() => {
            safeRemove("access_token");
            safeRemove("refresh_token");
            safeRemove("user");

            setUser(null);
            setToken(null);
            setAuthHeader(null);
            setStatus("unauthenticated");
        },
        [setAuthHeader]
    );

    const storeAuth = useCallback(
        (res: AuthResponse): AuthUser => {
            const normalized = normalizeUser(res.user);

            safeSet("access_token", res.token);

            if (res.refreshToken) {
                safeSet(
                    "refresh_token",
                    res.refreshToken
                );
            }

            safeSet(
                "user",
                JSON.stringify(normalized)
            );

            setAuthHeader(res.token);
            setToken(res.token);
            setUser(normalized);
            setStatus("authenticated");

            didLogInvalidRef.current = false;

            return normalized;
        },
        [setAuthHeader]
    );


    /**------------------------------
        Initial session hydration
    ---------------------------------*/
    const hydrate = useCallback(async () => {
        const hydrationVersion = authVersionRef.current;

        const storedToken = safeGet("access_token");

        const storedUser = safeGet("user");

        if (!storedToken) {
            setUser(null);
            setToken(null);
            setAuthHeader(null);
            setStatus("unauthenticated");
            return;
        }

        setToken(storedToken);
        setAuthHeader(storedToken);

        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser) as AuthUser;

                setUser(parsed);
            } catch {
                safeRemove("user");
            }
        }

        try {
            const profile = await authApi.me();

            /**----------------------------------------------------------------
                Another auth operation happened while /auth/me was running.
                Ignore this stale hydration result.
            -------------------------------------------------------------------*/
            if (
                hydrationVersion !== authVersionRef.current
            ) {
                return;
            }

            const normalized = normalizeUser(profile);

            setUser(normalized);

            safeSet(
                "user",
                JSON.stringify(normalized)
            );

            setStatus("authenticated");
            didLogInvalidRef.current = false;
        } catch (err: unknown) {
            /**---------------------------------------------------------------
                If login/register/logout happened after hydration started,
                do not clear that newer authentication state.
            ------------------------------------------------------------------*/
            if (
                hydrationVersion !== authVersionRef.current
            ) {
                return;
            }

            if (!didLogInvalidRef.current) {
                didLogInvalidRef.current = true;

                const axiosErr =
                    err as AxiosError<{
                        message?: string;
                        error?: string
                    }>;

                const message =
                    axiosErr.response?.data?.message ||
                    axiosErr.response?.data?.error ||
                    (err instanceof Error
                        ? err.message
                        : "Auth failed");

                void loggerApi.warn(
                    "Auth session invalid - clearing session",
                    { message }
                );
            }
            clearAuth();
        }
    }, [clearAuth, setAuthHeader]);

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    /**-----------------------------------------------------------------------------------------------
        Login function that calls the auth API and stores the returned token and user information.
        It also sets the loading state while the request is in progress.
    --------------------------------------------------------------------------------------------------*/
    const login = useCallback(
        async (
            data: LoginData
        ): Promise<AuthResponse> => {
            /**---------------------------------------------
                Invalidates any older hydration request.
            ------------------------------------------------*/
            const operationVersion = ++authVersionRef.current;

            setLoading(true);

            try {
                const res = await authApi.login(data);

                /**---------------------------------------------------------------------
                    Ignore only if another newer auth operation replaced this login.
                ------------------------------------------------------------------------*/
                if (
                    operationVersion !== authVersionRef.current
                ) {
                    return res;
                }

                storeAuth(res);

                return res;
            } catch (err) {
                if (
                    operationVersion === authVersionRef.current
                ) {
                    setStatus("unauthenticated");
                }

                throw err;
            } finally {
                if (
                    operationVersion !== authVersionRef.current
                ) {
                    setLoading(false);
                }
            }
        },
        [storeAuth]
    );

    /**-------------------------------------------------------------------------------------------------------------------------------
        Register function that calls the auth API to create a new user account and stores the returned token and user information.
        It also sets the loading state while the request is in progress.
    ----------------------------------------------------------------------------------------------------------------------------------*/
    const register = useCallback(
        async (
            data: RegisterData
        ): Promise<AuthResponse> => {
            const operationVersion = ++authVersionRef.current;

            setLoading(true);

            try {
                const res = await authApi.register(data);

                if (
                    operationVersion !== authVersionRef.current
                ) {
                    return res;
                }

                storeAuth(res);

                return res;
            } catch (err) {
                if (
                    operationVersion === authVersionRef.current
                ) {
                    setStatus("unauthenticated");
                }

                throw err;
            } finally {
                if (
                    operationVersion === authVersionRef.current
                ) {
                    setLoading(false);
                }
            }
        },
        [storeAuth]
    );

    /**--------------------------------------------------------------------------------
        Logout function that clears the authentication state and logs the user out.
    -----------------------------------------------------------------------------------*/
    const logout = useCallback(() => {
        /**----------------------------------------
            Invalidate in-flight auth requests.
        -------------------------------------------*/
        authVersionRef.current += 1;

        void loggerApi.log({
            level: "info",
            category: "auth",
            message: "User logged out",
        });

        clearAuth();
        setLoading(false);
    }, [clearAuth]);

    /**-----------------------------------------------------------------------------------------------------------
        Refresh profile function that fetches the latest user profile from the API and updates the user state.
        It does nothing if there is no token available.
    --------------------------------------------------------------------------------------------------------------*/
    const refreshUser = useCallback(async () => {
        const activeToken = token ?? safeGet("access_token");

        if (!activeToken) return;

        try {
            const raw: unknown = await userApi.getProfile();

            const normalized = normalizeUser(raw);

            if (
                normalized.id &&
                normalized.email
            ) {
                setUser(normalized);

                safeSet(
                    "user",
                    JSON.stringify(
                        normalized
                    )
                );
            }
        } catch {
            // Keep the existing authenticated session.
        }
    }, [token]);

    /**--------------------------------------------------------------------------------------------------------------------
        Context value memoization to prevent unnecessary re-renders of consumers when the context value hasn't changed.
    -----------------------------------------------------------------------------------------------------------------------*/
    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            user,
            token,
            loading,

            isAuthenticated:
                status ===
                    "authenticated" &&
                Boolean(token) &&
                Boolean(user),

            login,
            register,
            logout,
            refreshUser,
        }),
        [
            status,
            user,
            token,
            loading,
            login,
            register,
            logout,
            refreshUser,
        ]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
