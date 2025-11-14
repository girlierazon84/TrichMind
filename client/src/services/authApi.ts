// client/src/services/authApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/* ---------------------------------------------
 * TYPES — match backend EXACTLY
 * --------------------------------------------- */

export interface BackendUser {
    id: string;
    email: string;
    displayName?: string;
}

export interface BackendAuthResponse {
    ok: boolean;
    accessToken: string;
    refreshToken?: string;
    user: BackendUser;
}

export interface RegisterData {
    email: string;
    password: string;
    displayName?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface ResetPasswordData {
    token: string;
    newPassword: string;
}

export interface AuthResponse {
    token: string; // normalized accessToken
    refreshToken?: string;
    user: BackendUser;
}

/* ---------------------------------------------
 * NORMALIZER — convert backend → frontend
 * --------------------------------------------- */
function normalize(raw: BackendAuthResponse): AuthResponse {
    return {
        token: raw.accessToken,
        refreshToken: raw.refreshToken,
        user: {
            id: raw.user.id,
            email: raw.user.email,
            displayName: raw.user.displayName,
        },
    };
}

/* ---------------------------------------------
 * RAW CALLS — strictly typed
 * --------------------------------------------- */
async function rawRegister(data: RegisterData): Promise<AuthResponse> {
    const res = await axiosClient.post<BackendAuthResponse>("/api/auth/register", data);
    return normalize(res.data);
}

async function rawLogin(data: LoginData): Promise<AuthResponse> {
    const res = await axiosClient.post<BackendAuthResponse>("/api/auth/login", data);
    return normalize(res.data);
}

interface MeResponse {
    ok: boolean;
    user: BackendUser & Record<string, unknown>;
}

async function rawMe(token: string): Promise<MeResponse> {
    const res = await axiosClient.get<MeResponse>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
}

interface MsgResponse {
    message: string;
}

async function rawForgotPassword(email: string): Promise<MsgResponse> {
    const res = await axiosClient.post<MsgResponse>("/api/auth/forgot-password", { email });
    return res.data;
}

async function rawResetPassword(data: ResetPasswordData): Promise<MsgResponse> {
    const res = await axiosClient.post<MsgResponse>("/api/auth/reset-password", data);
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
    }),

    resetPassword: withLogging(rawResetPassword, {
        category: "auth",
        action: "resetPassword",
    }),
};
