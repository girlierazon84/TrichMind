// client/src/hooks/useAuth.ts

import { useState, useEffect, useCallback } from "react";
import {
    axiosClient,
    authApi,
    RegisterData,
    LoginData,
    AuthResponse,
    userApi,
} from "@/services";
import { useLogger } from "@/hooks";
import type { AxiosError } from "axios";

// types
interface User {
    id: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
}

/**------------------------
    Authentication Hook
---------------------------*/
export const useAuth = () => {
    // User state
    const [user, setUser] = useState<User | null>(
        JSON.parse(localStorage.getItem("user") || "null")
    );

    // JWT Access Token
    const [token, setToken] = useState<string | null>(
        localStorage.getItem("access_token")
    );

    // Loading state
    const [loading, setLoading] = useState(false);
    const { log, warn, error: logError } = useLogger(false);

    // normalize user object (handles various shapes: {user: {...}}, {...})
    const normalizeUser = useCallback((raw: unknown): User => {
        const obj = raw as Record<string, unknown>;
        const u = (obj.user as Record<string, unknown>) ?? obj;

        return {
            id: (u._id as string) ?? (u.id as string),
            email: (u.email as string) || "",
            displayName: u.displayName as string | undefined,
            // support both camelCase and snake_case just in case
            avatarUrl:
                (u.avatarUrl as string | undefined) ||
                (u.avatar_url as string | undefined),
        };
    }, []);

    // auth header
    const updateAuthHeader = useCallback((jwt: string | null) => {
        if (jwt) {
            axiosClient.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
        } else {
            delete axiosClient.defaults.headers.common["Authorization"];
        }
    }, []);

    // Ensure header is in sync on mount
    useEffect(() => {
        if (token) {
            updateAuthHeader(token);
        }
    }, [token, updateAuthHeader]);

    // logout
    const logout = useCallback(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        updateAuthHeader(null);
        log("User logged out");
    }, [log, updateAuthHeader]);

    // load user from /api/auth/me
    const loadUser = useCallback(async () => {
        if (!token) return;

        try {
            updateAuthHeader(token);

            const profile = await authApi.me();
            const normalized = normalizeUser(profile);

            setUser(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));
        } catch (err: unknown) {
            const axiosErr = err as AxiosError<{ error?: string }>;
            const expired =
                axiosErr.response?.data?.error === "Token expired";

            if (expired) warn("Token expired — logging out");

            logout();
        }
    }, [token, updateAuthHeader, normalizeUser, logout, warn]);

    // load user on token change
    useEffect(() => {
        if (token) void loadUser();
    }, [token, loadUser]);

    // store auth from login/register
    const storeAuth = useCallback(
        (res: AuthResponse): User => {
            // Access token
            localStorage.setItem("access_token", res.token);
            setToken(res.token);
            updateAuthHeader(res.token);

            // Refresh token (for /api/auth/refresh)
            if (res.refreshToken) {
                localStorage.setItem("refresh_token", res.refreshToken);
            }

            const normalized = normalizeUser(res.user);
            setUser(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));

            return normalized;
        },
        [normalizeUser, updateAuthHeader]
    );

    // register
    const register = async (data: RegisterData) => {
        setLoading(true);
        try {
            const res = await authApi.register(data);
            if (res.token) storeAuth(res);
            return res;
        } catch (err: unknown) {
            logError("Registration failed", {});
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // login
    const login = async (data: LoginData) => {
        setLoading(true);
        try {
            const res = await authApi.login(data);
            if (res.token) storeAuth(res);
            return res;
        } catch (err: unknown) {
            logError("Login failed", {});
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // forgot password
    const forgotPassword = async (email: string): Promise<{ message: string }> =>
        authApi.forgotPassword(email);

    // reset password
    const resetPassword = async (data: {
        token: string;
        newPassword: string;
    }): Promise<{ message: string }> => authApi.resetPassword(data);

    // refresh user (e.g. after profile/avatar update)
    const refreshUser = async () => {
        if (!token) return;

        try {
            const { user: rawUser } = await userApi.getProfile();
            const normalized = normalizeUser(rawUser);

            setUser(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));
        } catch (err) {
            console.error("Failed to refresh user:", err);
        }
    };

    return {
        user,
        token,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user,
        refreshUser,
    };
};

export default useAuth;
