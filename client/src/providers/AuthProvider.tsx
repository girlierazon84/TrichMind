// client/src/providers/AuthProvider.tsx
// Fix authVersionRef to avoid login, refresh, login again behavior.
// Central authentication and user-profile state.

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


/**----------
    Types
-------------*/
export interface AuthUser {
    id: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
}

type AuthStatus =
    | "hydrating"
    | "authenticated"
    | "unauthenticated";

type AuthContextValue = {
    status: AuthStatus;
    user: AuthUser | null;
    token: string | null;
    loading: boolean;

    isAuthenticated: boolean;

    login: (
        data: LoginData
    ) => Promise<AuthResponse>;

    register: (
        data: RegisterData
    ) => Promise<AuthResponse>;

    logout: () => void;

    refreshUser: () => Promise<void>;
};

export const AuthContext =
    createContext<AuthContextValue | null>(
        null
    );

/**-------------------------
    LocalStorage helpers
----------------------------*/
function safeGet(
    key: string
): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        return window.localStorage.getItem(
            key
        );
    } catch {
        return null;
    }
}

function safeSet(
    key: string,
    value: string
): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.setItem(
            key,
            value
        );
    } catch {
        // Storage may be unavailable.
    }
}

function safeRemove(
    key: string
): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.removeItem(
            key
        );
    } catch {
        // Storage may be unavailable.
    }
}

/**-------------------------------
    User normalization helpers
----------------------------------*/
function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

type UserWire =
    Record<string, unknown> & {
        _id?: string;
        id?: string;
        email?: string;
        displayName?: string;
        avatarUrl?: string;
        avatar_url?: string;
    };

function normalizeUser(
    raw: unknown
): AuthUser {
    const obj = isRecord(raw)
        ? raw
        : {};

    const maybeUser = (
        isRecord(obj.user)
            ? obj.user
            : obj
    ) as UserWire;

    const id =
        (
            typeof maybeUser._id ===
                "string" &&
            maybeUser._id
        ) ||
        (
            typeof maybeUser.id ===
                "string" &&
            maybeUser.id
        ) ||
        "";

    const email =
        (
            typeof maybeUser.email ===
                "string" &&
            maybeUser.email
        ) ||
        "";

    const displayName =
        typeof maybeUser.displayName ===
            "string"
                ? maybeUser.displayName
                : undefined;

    const avatarUrl =
        (
            typeof maybeUser.avatarUrl ===
                "string" &&
            maybeUser.avatarUrl
        ) ||
        (
            typeof maybeUser.avatar_url ===
                "string" &&
            maybeUser.avatar_url
        ) ||
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
    const [status, setStatus] =
        useState<AuthStatus>("hydrating");

    const [user, setUser] =
        useState<AuthUser | null>(null);

    const [token, setToken] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(false);

    /**----------------------------------------------------------------------------
        Prevent stale hydration requests from overwriting a newer login/logout.
    -------------------------------------------------------------------------------*/
    const authVersionRef = useRef(0);

    /**-------------------------------------------
        Prevent repeated invalid-session logs.
    ----------------------------------------------*/
    const didLogInvalidRef =
        useRef(false);

    const setAuthHeader = useCallback(
        (jwt: string | null) => {
            if (jwt) {
                axiosClient.defaults.headers.common.Authorization =
                    `Bearer ${jwt}`;
            } else {
                delete axiosClient
                    .defaults
                    .headers
                    .common
                    .Authorization;
            }
        },
        []
    );

    const persistUser = useCallback(
        (nextUser: AuthUser) => {
            setUser(nextUser);

            safeSet(
                "user",
                JSON.stringify(nextUser)
            );
        },
        []
    );

    const clearAuth = useCallback(
        () => {
            safeRemove("access_token");
            safeRemove("refresh_token");
            safeRemove("user");

            setUser(null);
            setToken(null);

            setAuthHeader(null);

            setStatus(
                "unauthenticated"
            );
        },
        [setAuthHeader]
    );

    const storeAuth = useCallback(
        (
            res: AuthResponse
        ): AuthUser => {
            const normalized =
                normalizeUser(res.user);

            safeSet(
                "access_token",
                res.token
            );

            if (res.refreshToken) {
                safeSet(
                    "refresh_token",
                    res.refreshToken
                );
            }

            setAuthHeader(res.token);
            setToken(res.token);

            persistUser(normalized);

            setStatus(
                "authenticated"
            );

            didLogInvalidRef.current =
                false;

            return normalized;
        },
        [
            persistUser,
            setAuthHeader,
        ]
    );

    /**------------------------------------------
        Retrieves the complete user profile.
        The profile endpoint contains fields
        that may not be included in the login
        response, including avatarurl.
    ---------------------------------------------*/
    const loadFullProfile =
        useCallback(async (): Promise<AuthUser | null> => {
            try {
                const raw: unknown =
                    await userApi.getProfile();

                const normalized =
                    normalizeUser(raw);

                if (
                    !normalized.id ||
                    !normalized.email
                ) {
                    return null;
                }

                persistUser(normalized);

                return normalized;
            } catch {
                return null;
            }
        }, [persistUser]);

    /**----------------------
        Initial hydration
    -------------------------*/
    const hydrate =
        useCallback(async () => {
            const hydrationVersion =
                authVersionRef.current;

            const storedToken =
                safeGet("access_token");

            const storedUser =
                safeGet("user");

            if (!storedToken) {
                setUser(null);
                setToken(null);

                setAuthHeader(null);

                setStatus(
                    "unauthenticated"
                );

                return;
            }

            setToken(storedToken);
            setAuthHeader(storedToken);

            if (storedUser) {
                try {
                    const parsed =
                        JSON.parse(
                            storedUser
                        ) as AuthUser;

                    setUser(parsed);
                } catch {
                    safeRemove("user");
                }
            }

            try {
                const meUser =
                    await authApi.me();

                if (
                    hydrationVersion !==
                    authVersionRef.current
                ) {
                    return;
                }

                /**------------------------------------------------
                    /auth/me is enough to validate the session.
                ---------------------------------------------------*/
                persistUser(
                    normalizeUser(meUser)
                );

                setStatus(
                    "authenticated"
                );

                didLogInvalidRef.current =
                    false;

                /**--------------------------------------------------------------------------------------
                    Then fetch the complete profile so avatarUrl and profile fields are synchronized.
                -----------------------------------------------------------------------------------------*/
                await loadFullProfile();
            } catch (err: unknown) {
                if(
                    hydrationVersion !==
                    authVersionRef.current
                ) {
                    return;
                }

                if(
                    !didLogInvalidRef.current
                ) {
                    didLogInvalidRef.current =
                        true;

                    const axiosErr =
                        err as AxiosError<{
                            message?: string;
                            error?: string;
                        }>;

                    const message =
                        axiosErr.response
                            ?.data
                            ?.message ||
                        axiosErr.response
                            ?.data
                            ?.error ||
                        (
                            err instanceof
                            Error
                                ? err.message
                                : "Auth failed"
                        );

                    void loggerApi.warn(
                        "Auth session invalid - clearing session",
                        { message }
                    );
                }

                clearAuth();
            }
        },
        [
            clearAuth,
            loadFullProfile,
            persistUser,
            setAuthHeader,
        ]
    );

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
            const operationVersion =
                ++authVersionRef.current;

            setLoading(true);

            try {
                const res =
                    await authApi.login(
                        data
                    );

                /**---------------------------------------------------------------------
                    Ignore only if another newer auth operation replaced this login.
                ------------------------------------------------------------------------*/
                if (
                    operationVersion !==
                    authVersionRef.current
                ) {
                    return res;
                }

                /**------------------------------------------------------
                    Immediately establish the authenticated sessiion.
                ---------------------------------------------------------*/
                storeAuth(res);

                /**-------------------------------------------------------------------
                    Fetch complete profile after token/header have been stored.
                    This ensures avatarUrl is available before/while Home renders.
                ----------------------------------------------------------------------*/
                await loadFullProfile();

                return res;
            } catch (err) {
                if (
                    operationVersion ===
                    authVersionRef.current
                ) {
                    setStatus(
                        "unauthenticated"
                    );
                }

                throw err;
            } finally {
                /**------------------------------------
                    FIX: This must be ===, not !==.
                ---------------------------------------*/
                if (
                    operationVersion ===
                    authVersionRef.current
                ) {
                    setLoading(false);
                }
            }
        },
        [
            loadFullProfile,
            storeAuth,
        ]
    );

    /**-------------------------------------------------------------------------------------------------------------------------------
        Register function that calls the auth API to create a new user account and stores the returned token and user information.
        It also sets the loading state while the request is in progress.
    ----------------------------------------------------------------------------------------------------------------------------------*/
    const register = useCallback(
        async (
            data: RegisterData
        ): Promise<AuthResponse> => {
            const operationVersion =
                ++authVersionRef.current;

            setLoading(true);

            try {
                const res =
                    await authApi.register(
                        data
                    );

                if (
                    operationVersion !==
                    authVersionRef.current
                ) {
                    return res;
                }

                storeAuth(res);

                await loadFullProfile();

                return res;
            } catch (err) {
                if (
                    operationVersion ===
                    authVersionRef.current
                ) {
                    setStatus(
                        "unauthenticated"
                    );
                }

                throw err;
            } finally {
                if (
                    operationVersion ===
                    authVersionRef.current
                ) {
                    setLoading(false);
                }
            }
        },
        [
            loadFullProfile,
            storeAuth,
        ]
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
    const refreshUser =
        useCallback(async () => {
            const activeToken =
                token ??
                safeGet(
                    "access_token"
                );

            if (!activeToken) {
                return;
            }

            await loadFullProfile();

        }, [
            token,
            loadFullProfile,
        ]);

    /**--------------------------------------------------------------------------------------------------------------------
        Context value memoization to prevent unnecessary re-renders of consumers when the context value hasn't changed.
    -----------------------------------------------------------------------------------------------------------------------*/
    const value =
        useMemo<AuthContextValue>(
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
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
}
