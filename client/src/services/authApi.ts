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

/**----------------------------------------------------------------
    User information shared by authentication endpoints.
    avatarUrl must be preserved so an existing profile picture
    is immediately available after login and session hydration.
-------------------------------------------------------------------*/
export interface AuthUser {
    id: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
}

export interface AuthResponse {
    token: string;
    refreshToken?: string;
    user: AuthUser;
}

/**--------------
    Raw types
-----------------*/
interface RawAuthUser {
    id?: string;
    _id?: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    avatar_url?: string;
}

interface RawAuthResponse {
    token: string;
    refreshToken?: string;
    user: RawAuthUser;
}

/**--------------------------------------
    Normalize authentication response
-----------------------------------------*/
function normalizeUser(raw: RawAuthUser): AuthUser {
    return {
        id: raw.id ?? raw._id ?? "",
        email: raw.email,
        displayName: raw.displayName,
        avatarUrl:
            raw.avatarUrl ??
            raw.avatar_url ??
            undefined,
    };
}

function normalize(
    raw: RawAuthResponse
): AuthResponse {
    return {
        token: raw.token,
        refreshToken: raw.refreshToken,
        user: normalizeUser(raw.user),
    };
}

/**----------------------------------------------
    Raw API calls
    axiosClient baseURL already includes /api
-------------------------------------------------*/
async function rawRegister(
    data: RegisterData
): Promise<AuthResponse> {
    // Make POST request to /auth/register
    const res =
        await axiosClient.post<RawAuthResponse>(
            "/auth/register",
            data
        );

    return normalize(res.data);
}

// Login raw call
async function rawLogin(
    data: LoginData
): Promise<AuthResponse> {
    // Make POST request to /auth/login
    const res =
        await axiosClient.post<RawAuthResponse>(
            "/auth/login",
            data
        );

    return normalize(res.data);
}

/**-------------------------------------------------------
    Do not wrap /auth/me with request logging.
    It can run during hydration and route transitions.
----------------------------------------------------------*/
async function rawMe(): Promise<AuthUser> {
    // Make GET request to /auth/me
    const res =
        await axiosClient.get<{
            ok: boolean;
            user: RawAuthUser;
        }>("/auth/me");

    return normalizeUser(res.data.user);
}

// Forgot password raw call
async function rawForgotPassword(
    email: string
): Promise<{ message: string }> {
    // Make POST request to /auth/forgot-password
    const res =
        await axiosClient.post<{
            message: string
        }>(
            "/auth/forgot-password",
            { email }
        );

    return res.data;
}

// Reset password raw call
async function rawResetPassword(data: {
    token: string;
    newPassword: string
}): Promise<{ message: string }> {
    // Make POST request to /auth/reset-password
    const res =
        await axiosClient.post<{
            message: string
        }>(
            "/auth/reset-password",
            data
        );

    return res.data;
}

// Change password raw call
async function rawChangePassword(data: {
    oldPassword: string;
    newPassword: string;
}) {
    // Make POST request to /auth/change-password
    const res =
        await axiosClient.post(
            "/auth/change-password",
            data
        );

    return res.data;
}

/**-------------
    Auth API
----------------*/
export const authApi = {
    // ✅ wrapped with withLogging
    register: withLogging(
        rawRegister,
        {
            category: "auth",
            action: "auth_register",
        }
    ),

    login: withLogging(
        rawLogin,
        {
            category: "auth",
            action: "auth_login",
        }
    ),

    // ✅ no withLogging here
    me: rawMe,

    // ✅ wrapped with withLogging
    forgotPassword: withLogging(
        rawForgotPassword,
        {
            category: "auth",
            action: "auth_forgotPassword",
        }
    ),

    resetPassword: withLogging(
        rawResetPassword,
        {
            category: "auth",
            action: "auth_resetPassword",
        }
    ),

    changePassword: withLogging(
        rawChangePassword,
        {
            category: "auth",
            action: "auth_changePassword",
        }
    ),
};

export default authApi;
