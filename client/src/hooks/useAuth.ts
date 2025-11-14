// client/src/hooks/useAuth.ts

import { useState, useEffect, useCallback } from "react";
import {
    axiosClient,
    authApi,
    RegisterData,
    LoginData,
    ResetPasswordData,
    AuthResponse,
} from "@/services";
import { useLogger } from "@/hooks";


interface User {
    id: string;
    email: string;
    displayName?: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(
        localStorage.getItem("access_token")
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { log, warn, error: logError } = useLogger(false);

    /* ----------------------------------------------------------------
     * Normalize raw user → User
     * ---------------------------------------------------------------- */
    const normalizeUser = useCallback((raw: unknown): User => {
        const obj = raw as Record<string, unknown>;
        const u = (obj.user as Record<string, unknown>) ?? obj;

        return {
            id: (u._id as string) ?? (u.id as string),
            email: u.email as string,
            displayName: (u.displayName as string) ?? undefined,
        };
    }, []);

    /* ----------------------------------------------------------------
     * Set/Clear Authorization Header
     * ---------------------------------------------------------------- */
    const setAuthHeader = useCallback((jwt: string | null): void => {
        if (jwt) {
            axiosClient.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
        } else {
            delete axiosClient.defaults.headers.common["Authorization"];
        }
    }, []);

    /* ----------------------------------------------------------------
     * Logout
     * ---------------------------------------------------------------- */
    const logout = useCallback((): void => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        setAuthHeader(null);
        log("User logged out");
    }, [log, setAuthHeader]);

    /* ----------------------------------------------------------------
     * Fetch current user (me)
     * ---------------------------------------------------------------- */
    const fetchUser = useCallback(async (): Promise<void> => {
        if (!token) return;

        try {
            setAuthHeader(token);
            const profile = await authApi.me(token);
            const normalized = normalizeUser(profile);
            setUser(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));
            log("User authenticated", { userId: normalized.id });
        } catch {
            warn("Invalid token — logging out.");
            logout();
        }
    }, [token, logout, log, warn, normalizeUser, setAuthHeader, authApi]);

    useEffect(() => {
        if (token) {
            void fetchUser();
        }
    }, [token, fetchUser]);

    /* ----------------------------------------------------------------
     * Store token + user after Login/Register
     * ---------------------------------------------------------------- */
    const storeAuth = useCallback(
        (res: AuthResponse): User => {
            const jwt = res.token;
            localStorage.setItem("access_token", jwt);

            setToken(jwt);
            setAuthHeader(jwt);

            const normalized = normalizeUser(res.user);
            setUser(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));

            return normalized;
        },
        [normalizeUser, setAuthHeader]
    );

    /* ----------------------------------------------------------------
     * Register
     * ---------------------------------------------------------------- */
    const register = async (data: RegisterData): Promise<AuthResponse | null> => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await authApi.register(data);

            if (res?.token) {
                const u = storeAuth(res);
                log("User registered", { userId: u.id });
                setSuccess("Registration successful!");
            }

            return res;
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Registration failed";
            setError(msg);
            logError("Registration failed", { email: data.email, msg });
            return null;
        } finally {
            setLoading(false);
        }
    };

    /* ----------------------------------------------------------------
     * Login
     * ---------------------------------------------------------------- */
    const login = async (data: LoginData): Promise<AuthResponse | null> => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await authApi.login(data);

            if (res?.token) {
                const u = storeAuth(res);
                log("User logged in", { userId: u.id });
                setSuccess("Login successful!");
            }

            return res;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Login failed";
            setError(msg);
            logError("Login failed", { email: data.email, msg });
            return null;
        } finally {
            setLoading(false);
        }
    };

    /* ----------------------------------------------------------------
     * Forgot Password
     * ---------------------------------------------------------------- */
    const forgotPassword = async (email: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await authApi.forgotPassword(email);
            setSuccess(res.message || "Reset link sent.");
            log("Password reset requested", { email });
            return true;
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Failed to send reset email";
            setError(msg);
            logError("Forgot password failed", { email, msg });
            return false;
        } finally {
            setLoading(false);
        }
    };

    /* ----------------------------------------------------------------
     * Reset Password
     * ---------------------------------------------------------------- */
    const resetPassword = async (
        data: ResetPasswordData
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await authApi.resetPassword(data);
            setSuccess(res.message || "Password reset successfully.");
            log("Password reset successful");
            return true;
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Failed to reset password";
            setError(msg);
            logError("Reset password failed", { msg });
            return false;
        } finally {
            setLoading(false);
        }
    };

    /* ----------------------------------------------------------------
     * Manual fetch user
     * ---------------------------------------------------------------- */
    const me = async (): Promise<User | null> => {
        if (!token) return null;

        try {
            const profile = await authApi.me(token);
            const normalized = normalizeUser(profile);
            setUser(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));
            log("Fetched user", { userId: normalized.id });
            return normalized;
        } catch {
            warn("Failed to fetch user — logging out.");
            logout();
            return null;
        }
    };

    return {
        user,
        token,
        loading,
        error,
        success,

        register,
        login,
        forgotPassword,
        resetPassword,
        me,
        logout,

        isAuthenticated: !!user,
    };
};

export default useAuth;
