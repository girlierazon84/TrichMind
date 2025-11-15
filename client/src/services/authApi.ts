// client/src/services/authApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/* ---------------------------------------------
 * TYPES
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
    token: string;
    refreshToken?: string;
    user: AuthUser;
}

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
        token: raw.token,
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

/* FIXED: me() no longer requires a token argument */
async function rawMe(): Promise<AuthUser> {
    const res = await axiosClient.get<{ ok: boolean; user: AuthUser }>("/api/auth/me");
    return res.data.user;
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

async function rawChangePassword(data: {
    oldPassword: string;
    newPassword: string;
}) {
    const res = await axiosClient.post("/api/auth/change-password", data);
    return res.data;
}

/* ---------------------------------------------
 * EXPORT API
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

    changePassword: withLogging(rawChangePassword, {
        category: "auth",
        action: "changePassword",
        showToast: true,
        successMessage: "Password updated!",
        errorMessage: "Failed to change password.",
    }),
};
