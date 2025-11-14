// client/src/services/authApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/* ---------------------------------------------
 * TYPES — match backend EXACTLY
 * --------------------------------------------- */
export interface RegisterData {
    email: string;
    password: string;
    displayName?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    email: string;
    displayName?: string;
}

export interface AuthResponse {
    token: string;             // backend: token
    refreshToken?: string;     // backend: refreshToken
    user: AuthUser;            // backend: user
}

/* ---------------------------------------------
 * NORMALIZER — convert backend → frontend
 * --------------------------------------------- */
interface RawAuthResponse {
    token: string;
    refreshToken?: string;
    user: {
        id: string;
        email: string;
        displayName?: string;
    };
}

function normalize(raw: RawAuthResponse): AuthResponse {
    return {
        token: raw.token,                // 🟢 backend matches this exactly
        refreshToken: raw.refreshToken,
        user: {
            id: raw.user.id,
            email: raw.user.email,
            displayName: raw.user.displayName,
        },
    };
}

/* ---------------------------------------------
 * RAW CALLS (unwrapped)
 * --------------------------------------------- */
async function rawRegister(data: RegisterData): Promise<AuthResponse> {
    const res = await axiosClient.post<RawAuthResponse>("/api/auth/register", data);
    return normalize(res.data);
}

async function rawLogin(data: LoginData): Promise<AuthResponse> {
    const res = await axiosClient.post<RawAuthResponse>("/api/auth/login", data);
    return normalize(res.data);
}

async function rawMe(token: string): Promise<AuthUser> {
    const res = await axiosClient.get<{ ok: boolean; user: AuthUser }>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return {
        id: res.data.user.id,
        email: res.data.user.email,
        displayName: res.data.user.displayName,
    };
}

async function rawForgotPassword(email: string): Promise<{ message: string }> {
    const res = await axiosClient.post<{ message: string }>(
        "/api/auth/forgot-password",
        { email }
    );
    return res.data;
}

async function rawResetPassword(data: { token: string; newPassword: string }): Promise<{ message: string }> {
    const res = await axiosClient.post<{ message: string }>(
        "/api/auth/reset-password",
        data
    );
    return res.data;
}

/* ---------------------------------------------
 * EXPORT API WITH LOGGING WRAPPERS
 * --------------------------------------------- */
export const authApi = {
    register: withLogging(rawRegister, {
        category: "auth",
        action: "register",
        showToast: true,
        successMessage: "Registration successful!",
        errorMessage: "Registration failed.",
    }),

    login: withLogging(rawLogin, {
        category: "auth",
        action: "login",
        showToast: true,
        successMessage: "Login successful!",
        errorMessage: "Login failed.",
    }),

    me: withLogging(rawMe, {
        category: "auth",
        action: "me",
    }),

    forgotPassword: withLogging(rawForgotPassword, {
        category: "auth",
        action: "forgotPassword",
        showToast: true,
        successMessage: "Reset link sent!",
        errorMessage: "Failed to send reset link.",
    }),

    resetPassword: withLogging(rawResetPassword, {
        category: "auth",
        action: "resetPassword",
        showToast: true,
        successMessage: "Password reset successful!",
        errorMessage: "Failed to reset password.",
    }),
};
