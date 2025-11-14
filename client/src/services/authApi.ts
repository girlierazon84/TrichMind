// client/src/services/authApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/* -------------------------------------------
 * TYPES — FRONTEND MODELS
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

/* -------------------------------------------
 * TYPES — BACKEND RESPONSE MODELS
 * ------------------------------------------- */
interface BackendUser {
    _id?: string;
    id?: string;
    email: string;
    displayName?: string;
}

interface BackendAuthResponse {
    ok?: boolean;
    accessToken: string;
    refreshToken?: string;
    user: BackendUser;
}

/* -------------------------------------------
 * Normalizer — backend → frontend shape
 * ------------------------------------------- */
function normalizeAuthResponse(raw: BackendAuthResponse): AuthResponse {
    const backendUser = raw.user;

    return {
        token: raw.accessToken,
        refreshToken: raw.refreshToken,
        user: {
            id: backendUser._id ?? backendUser.id ?? "",
            email: backendUser.email,
            displayName: backendUser.displayName,
        },
    };
}

/* -------------------------------------------
 * RAW API CALLS (typed)
 * ------------------------------------------- */
async function rawRegister(data: RegisterData): Promise<AuthResponse> {
    const res = await axiosClient.post<BackendAuthResponse>("/auth/register", data);
    return normalizeAuthResponse(res.data);
}

async function rawLogin(data: LoginData): Promise<AuthResponse> {
    const res = await axiosClient.post<BackendAuthResponse>("/auth/login", data);
    return normalizeAuthResponse(res.data);
}

async function rawForgotPassword(email: string): Promise<{ message: string }> {
    const res = await axiosClient.post<{ message: string }>("/auth/forgot-password", { email });
    return res.data;
}

async function rawResetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const res = await axiosClient.post<{ message: string }>("/auth/reset-password", data);
    return res.data;
}

interface BackendMeResponse {
    user?: BackendUser;
    _id?: string;
    id?: string;
    email?: string;
    displayName?: string;
}

async function rawMe(token: string): Promise<AuthUser> {
    const res = await axiosClient.get<BackendMeResponse>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
    });

    const u = res.data.user ?? res.data;

    return {
        id: u._id ?? u.id ?? "",
        email: u.email ?? "",
        displayName: u.displayName,
    };
}

/* -------------------------------------------
 * EXPORT API (wrapped with logging)
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
