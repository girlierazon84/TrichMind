// client/src/services/authApi.ts

import { axiosClient } from "./axiosClient";
import { loggerApi } from "./loggerApi";

export interface RegisterData {
    email: string;
    password: string;
    displayName?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    token: string;
    newPassword: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        displayName?: string;
    };
}

/**
 * 🌐 Auth API — handles register, login, and password management
 * Now includes structured logging via loggerApi
 */
export const authApi = {
    /** 🧾 Register a new user */
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const start = performance.now();
        try {
            const res = await axiosClient.post<AuthResponse>("/auth/register", data);
            await loggerApi.log({
                category: "auth",
                level: "info",
                message: "User registration successful",
                context: { email: data.email, duration: performance.now() - start },
            });
            return res.data;
        } catch (err) {
            await loggerApi.error("User registration failed", {
                email: data.email,
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    },

    /** 🔑 Log in user */
    login: async (data: LoginData): Promise<AuthResponse> => {
        const start = performance.now();
        try {
            const res = await axiosClient.post<AuthResponse>("/auth/login", data);
            await loggerApi.log({
                category: "auth",
                level: "info",
                message: "User login successful",
                context: { email: data.email, duration: performance.now() - start },
            });
            return res.data;
        } catch (err) {
            await loggerApi.error("User login failed", {
                email: data.email,
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    },

    /** 📧 Request a password reset link */
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        try {
            const res = await axiosClient.post<{ message: string }>("/auth/forgot-password", { email });
            await loggerApi.warn("Password reset requested", { email });
            return res.data;
        } catch (err) {
            await loggerApi.error("Password reset request failed", {
                email,
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    },

    /** 🔁 Reset password with valid token */
    resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
        try {
            const res = await axiosClient.post<{ message: string }>("/auth/reset-password", data);
            await loggerApi.log({
                category: "auth",
                level: "info",
                message: "Password reset successful",
                context: { token: data.token.slice(0, 6) + "***" },
            });
            return res.data;
        } catch (err) {
            await loggerApi.error("Password reset failed", {
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    },

    /** 🧠 Get current authenticated user */
    me: async (token: string) => {
        try {
            const res = await axiosClient.get("/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            await loggerApi.log({
                category: "auth",
                level: "debug",
                message: "Fetched authenticated user",
                context: { tokenPreview: token.slice(0, 6) + "***" },
            });
            return res.data;
        } catch (err) {
            await loggerApi.error("Fetching user session failed", {
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    },
};
