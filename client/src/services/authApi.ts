// client/src/services/authApi.ts
import { axiosClient } from "@/services";
import { withLogging } from "@/utils";

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
    token: string;
    user: {
        id: string;
        email: string;
        displayName?: string;
    };
}

async function rawRegister(data: RegisterData): Promise<AuthResponse> {
    const res = await axiosClient.post<AuthResponse>("/auth/register", data);
    return res.data;
}

async function rawLogin(data: LoginData): Promise<AuthResponse> {
    const res = await axiosClient.post<AuthResponse>("/auth/login", data);
    return res.data;
}

async function rawForgotPassword(email: string): Promise<{ message: string }> {
    const res = await axiosClient.post<{ message: string }>("/auth/forgot-password", { email });
    return res.data;
}

async function rawResetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const res = await axiosClient.post<{ message: string }>("/auth/reset-password", data);
    return res.data;
}

async function rawMe(token: string) {
    const res = await axiosClient.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
}

export const authApi = {
    register: withLogging(rawRegister, {
        category: "auth",
        action: "register",
        showToast: true,
        successMessage: "Registration successful!",
        errorMessage: "Registration failed. Please try again.",
    }),

    login: withLogging(rawLogin, {
        category: "auth",
        action: "login",
        showToast: true,
        successMessage: "Login successful!",
        errorMessage: "Login failed. Please check your credentials.",
    }),

    forgotPassword: withLogging(rawForgotPassword, {
        category: "auth",
        action: "forgotPassword",
        showToast: true,
        successMessage: "Reset link sent to your email.",
        errorMessage: "Failed to send reset email.",
    }),

    resetPassword: withLogging(rawResetPassword, {
        category: "auth",
        action: "resetPassword",
        showToast: true,
        successMessage: "Password reset successfully.",
        errorMessage: "Failed to reset password.",
    }),

    me: withLogging(rawMe, {
        category: "auth",
        action: "me",
    }),
};
