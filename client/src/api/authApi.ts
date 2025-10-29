// client/src/api/authApi.ts
import { axiosClient } from "./axiosClient";

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

export const authApi = {
    register: async (data: RegisterData) => {
        const res = await axiosClient.post("/auth/register", data);
        return res.data;
    },

    login: async (data: LoginData) => {
        const res = await axiosClient.post("/auth/login", data);
        return res.data;
    },

    forgotPassword: async (email: string) => {
        const res = await axiosClient.post("/auth/forgot-password", { email });
        return res.data;
    },

    resetPassword: async (data: ResetPasswordData) => {
        const res = await axiosClient.post("/auth/reset-password", data);
        return res.data;
    },

    me: async (token: string) => {
        const res = await axiosClient.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    },
};
