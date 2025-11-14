// client/src/services/authApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";

/* -------------------------------------------
 * TYPES - align with backend
 * ------------------------------------------- */
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
    token: string; // normalized access token
    refreshToken?: string;
    user: {
        id: string;
        email: string;
        displayName?: string;
    };
}

/* Backend raw responses */
interface BackendAuthPayload {
    ok: boolean;
    user: {
        _id?: string;
        id?: string;
        email: string;
        displayName?: string;
    };
    accessToken: string;
    refreshToken?: string;
}

/* -------------------------------------------
 * Normalizer - backend → frontend shape
 * ------------------------------------------- */
function normalizeAuthResponse(raw: BackendAuthPayload): AuthResponse {
    const u = raw.user;
    return {
        token: raw.accessToken,
        refreshToken: raw.refreshToken,
        user: {
            id: u._id ?? u.id ?? "",
            email: u.email,
            displayName: u.displayName,
        },
    };
}

/* -------------------------------------------
 * RAW API CALLS  (all prefixed with /api)
 * ------------------------------------------- */
async function rawRegister(data: RegisterData): Promise<AuthResponse> {
    const res = await axiosClient.post<BackendAuthPayload>("/api/auth/register", data);
    return normalizeAuthResponse(res.data);
}

async function rawLogin(data: LoginData): Promise<AuthResponse> {
    const res = await axiosClient.post<BackendAuthPayload>("/api/auth/login", data);
    return normalizeAuthResponse(res.data);
}

interface ForgotPasswordResponse {
    ok: boolean;
    message: string;
}

async function rawForgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const res = await axiosClient.post<ForgotPasswordResponse>(
        "/api/auth/forgot-password",
        { email }
    );
    return res.data;
}

interface ResetPasswordResponse {
    ok: boolean;
    message: string;
}

async function rawResetPassword(
    data: ResetPasswordData
): Promise<ResetPasswordResponse> {
    const res = await axiosClient.post<ResetPasswordResponse>(
        "/api/auth/reset-password",
        data
    );
    return res.data;
}

interface MeResponse {
    ok: boolean;
    user: {
        _id?: string;
        id?: string;
        email: string;
        displayName?: string;
    };
}

async function rawMe(token: string) {
    const res = await axiosClient.get<MeResponse>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
    });

    const u = res.data.user;
    return {
        id: u._id ?? u.id ?? "",
        email: u.email,
        displayName: u.displayName,
    };
}

/* -------------------------------------------
 * EXPORT API (with logging)
 * ------------------------------------------- */
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
        errorMessage: "Invalid login credentials.",
    }),

    forgotPassword: withLogging(rawForgotPassword, {
        category: "auth",
        action: "forgotPassword",
        showToast: true,
        successMessage: "Reset link sent!",
        errorMessage: "Could not send reset link.",
    }),

    resetPassword: withLogging(rawResetPassword, {
        category: "auth",
        action: "resetPassword",
        showToast: true,
        successMessage: "Password updated.",
        errorMessage: "Password reset failed.",
    }),

    me: withLogging(rawMe, {
        category: "auth",
        action: "me",
    }),
};
