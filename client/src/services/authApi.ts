// client/src/services/authApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";

/* ----------
    TYPES
------------- */
// Registration data
export interface RegisterData {
    email: string;
    password: string;
    displayName?: string;
}

// Login data
export interface LoginData {
    email: string;
    password: string;
}


// Authenticated user data
export interface AuthUser {
    id: string;
    email: string;
    displayName?: string;
}

// Auth response
export interface AuthResponse {
    token: string;
    refreshToken?: string;
    user: AuthUser;
}

// Raw auth response from backend
interface RawAuthResponse {
    token: string;
    refreshToken?: string;
    user: {
        id: string;
        email: string;
        displayName?: string;
    };
}

/**------------------
    NORMALIZATION
---------------------*/
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

/**--------------------------
    RAW CALLS (unwrapped)
-----------------------------*/
// Register hits /api/auth/register and returns { token, refreshToken, user }
async function rawRegister(data: RegisterData): Promise<AuthResponse> {
    const res = await axiosClient.post<RawAuthResponse>("/api/auth/register", data);
    return normalize(res.data);
}

// Login hits /api/auth/login and returns { token, refreshToken, user }
async function rawLogin(data: LoginData): Promise<AuthResponse> {
    const res = await axiosClient.post<RawAuthResponse>("/api/auth/login", data);
    return normalize(res.data);
}

// me() hits /api/auth/me and returns { ok, user }
async function rawMe(): Promise<AuthUser> {
    const res = await axiosClient.get<{ ok: boolean; user: AuthUser }>("/api/auth/me");
    return res.data.user;
}

// forgotPassword hits /api/auth/forgot-password and returns { message }
async function rawForgotPassword(email: string): Promise<{ message: string }> {
    const res = await axiosClient.post<{ message: string }>(
        "/api/auth/forgot-password",
        { email }
    );
    return res.data;
}

// resetPassword hits /api/auth/reset-password and returns { message }
async function rawResetPassword(data: { token: string; newPassword: string }): Promise<{ message: string }> {
    const res = await axiosClient.post<{ message: string }>(
        "/api/auth/reset-password",
        data
    );
    return res.data;
}

// changePassword hits /api/auth/change-password and returns { message }
async function rawChangePassword(data: {
    oldPassword: string;
    newPassword: string;
}) {
    const res = await axiosClient.post("/api/auth/change-password", data);
    return res.data;
}

/**---------------
    EXPORT API
------------------*/
export const authApi = {
    // Register: wrapped calls with logging and toast notifications
    register: withLogging(rawRegister, {
        category: "auth",
        action: "register",
        showToast: true,
        successMessage: "Registration successful!",
        errorMessage: "Registration failed.",
    }),

    // Login: wrapped calls with logging and toast notifications
    login: withLogging(rawLogin, {
        category: "auth",
        action: "login",
        showToast: true,
        successMessage: "Login successful!",
        errorMessage: "Login failed.",
    }),

    // Me: wrapped calls with logging and toast notifications
    me: withLogging(rawMe, {
        category: "auth",
        action: "me",
    }),

    // Forgot Password: wrapped calls with logging and toast notifications
    forgotPassword: withLogging(rawForgotPassword, {
        category: "auth",
        action: "forgotPassword",
        showToast: true,
        successMessage: "Reset link sent!",
        errorMessage: "Failed to send reset link.",
    }),

    // Reset Password: wrapped calls with logging and toast notifications
    resetPassword: withLogging(rawResetPassword, {
        category: "auth",
        action: "resetPassword",
        showToast: true,
        successMessage: "Password reset successful!",
        errorMessage: "Failed to reset password.",
    }),

    // Change Password: wrapped calls with logging and toast notifications
    changePassword: withLogging(rawChangePassword, {
        category: "auth",
        action: "changePassword",
        showToast: true,
        successMessage: "Password updated!",
        errorMessage: "Failed to change password.",
    }),
};

export default authApi;
