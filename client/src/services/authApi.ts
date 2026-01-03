// client/src/services/authApi.ts

"use client";

import { axiosClient } from "@/services/axiosClient";
import { withLogging } from "@/utils";


/*-----------
    TYPES
-------------*/
// Data sent to register endpoint
export interface RegisterData {
    email: string;
    password: string;
    displayName?: string;
}

// Data sent to login endpoint
export interface LoginData {
    email: string;
    password: string;
}

// Authenticated user info
export interface AuthUser {
    id: string;
    email: string;
    displayName?: string;
}

// Response from auth endpoints
export interface AuthResponse {
    token: string;
    refreshToken?: string;
    user: AuthUser;
}

/*---------------
    RAW CALLS
-----------------*/
interface RawAuthResponse {
    token: string;
    refreshToken?: string;
    user: { id: string; email: string; displayName?: string };
}

/**------------------------------------------------
    Normalize raw auth response to AuthResponse
---------------------------------------------------*/
function normalize(raw: RawAuthResponse): AuthResponse {
    // Map raw response to AuthResponse structure
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

/**----------------------------------------------------------
    RAW CALLS (axiosClient baseURL already includes /api)
-------------------------------------------------------------*/
async function rawRegister(data: RegisterData): Promise<AuthResponse> {
    // Make POST request to /auth/register
    const res = await axiosClient.post<RawAuthResponse>("/auth/register", data);
    return normalize(res.data);
}

// Login raw call
async function rawLogin(data: LoginData): Promise<AuthResponse> {
    // Make POST request to /auth/login
    const res = await axiosClient.post<RawAuthResponse>("/auth/login", data);
    return normalize(res.data);
}

/**------------------------------------------------------------------------------------------
    IMPORTANT:
    /auth/me is called frequently (rehydration, route transitions, protected pages).
    Don’t wrap with withLogging to avoid log storms if there’s any redirect/remount loop.
---------------------------------------------------------------------------------------------*/
async function rawMe(): Promise<AuthUser> {
    // Make GET request to /auth/me
    const res = await axiosClient.get<{ ok: boolean; user: AuthUser }>("/auth/me");
    return res.data.user;
}

// Forgot password raw call
async function rawForgotPassword(email: string): Promise<{ message: string }> {
    // Make POST request to /auth/forgot-password
    const res = await axiosClient.post<{ message: string }>("/auth/forgot-password", { email });
    return res.data;
}

// Reset password raw call
async function rawResetPassword(data: { token: string; newPassword: string }): Promise<{ message: string }> {
    // Make POST request to /auth/reset-password
    const res = await axiosClient.post<{ message: string }>("/auth/reset-password", data);
    return res.data;
}

// Change password raw call
async function rawChangePassword(data: { oldPassword: string; newPassword: string }) {
    // Make POST request to /auth/change-password
    const res = await axiosClient.post("/auth/change-password", data);
    return res.data;
}

/*----------------------------
    EXPORTS Auth API CALLS
------------------------------*/
export const authApi = {
    // ✅ wrapped with withLogging
    register: withLogging(rawRegister, { category: "auth", action: "auth_register" }),
    login: withLogging(rawLogin, { category: "auth", action: "auth_login" }),

    // ✅ no withLogging here
    me: rawMe,

    // ✅ wrapped with withLogging
    forgotPassword: withLogging(rawForgotPassword, { category: "auth", action: "auth_forgotPassword" }),
    resetPassword: withLogging(rawResetPassword, { category: "auth", action: "auth_resetPassword" }),
    changePassword: withLogging(rawChangePassword, { category: "auth", action: "auth_changePassword" }),
};

export default authApi;
