// client/src/hooks/useAuth.ts

import { useState, useEffect, useCallback } from "react";
import { axiosClient } from "@/services/axiosClient";
import {
    authApi,
    RegisterData,
    LoginData,
    ResetPasswordData,
    AuthResponse,
} from "@/services/authApi";

interface User {
    id: string;
    email: string;
    displayName?: string;
}

/**
 * 🧠 useAuth — authentication lifecycle hook
 * Handles register, login, logout, token persistence, forgot/reset password
 */
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    /** 🔐 Attach or clear Authorization header */
    const setAuthHeader = (jwt: string | null) => {
        if (jwt) axiosClient.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
        else delete axiosClient.defaults.headers.common["Authorization"];
    };

    /** 🚪 Logout and clear session */
    const logout = useCallback(() => {
        localStorage.removeItem("access_token");
        setToken(null);
        setUser(null);
        setAuthHeader(null);
    }, []);

    /** 📥 Auto-load user if token exists */
    const fetchUser = useCallback(async () => {
        if (!token) return;
        setAuthHeader(token);
        try {
            const data = await authApi.me(token);
            setUser(data);
        } catch {
            console.warn("Token invalid or expired — logging out.");
            logout();
        }
    }, [token, logout]);

    useEffect(() => {
        if (token) fetchUser();
    }, [token, fetchUser]);

    /** 🧾 Register new user */
    const register = async (data: RegisterData): Promise<AuthResponse | null> => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await authApi.register(data);
            if (res?.token) {
                localStorage.setItem("access_token", res.token);
                setToken(res.token);
                setAuthHeader(res.token);
                setUser(res.user);
                setSuccess("Registration successful!");
            }
            return res;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Registration failed";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    /** 🔑 Login existing user */
    const login = async (data: LoginData): Promise<AuthResponse | null> => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await authApi.login(data);
            if (res?.token) {
                localStorage.setItem("access_token", res.token);
                setToken(res.token);
                setAuthHeader(res.token);
                setUser(res.user);
                setSuccess("Login successful!");
            }
            return res;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Login failed";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    /** 📧 Forgot password — send reset link */
    const forgotPassword = async (email: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await authApi.forgotPassword(email);
            setSuccess(res.message || "Reset link sent to your email.");
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to send reset email.";
            setError(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    /** 🔁 Reset password with token */
    const resetPassword = async (data: ResetPasswordData): Promise<boolean> => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await authApi.resetPassword(data);
            setSuccess(res.message || "Password reset successfully.");
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to reset password.";
            setError(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    /** 🧠 Fetch authenticated user manually */
    const me = async (): Promise<User | null> => {
        if (!token) return null;
        try {
            const data = await authApi.me(token);
            setUser(data);
            return data;
        } catch {
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
}
