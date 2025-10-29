// client/src/api/healthApi.ts
import { axiosClient } from "./axiosClient";

export interface HealthLogData {
    sleepHours: number;
    stressLevel: number;
    exerciseMinutes: number;
    date?: string;
}

export const healthApi = {
    /** 🩺 Create new health log */
    create: async (data: HealthLogData) => {
        const res = await axiosClient.post("/health", data);
        return res.data;
    },

    /** 📅 Get user's health logs (optionally filtered by date range) */
    list: async (params?: { from?: string; to?: string; page?: number; limit?: number }) => {
        const res = await axiosClient.get("/health", { params });
        return res.data;
    },

    /** 🧠 Get a single health log by ID */
    getById: async (id: string) => {
        const res = await axiosClient.get(`/health/${id}`);
        return res.data;
    },

    /** ✏️ Update an existing health log */
    update: async (id: string, data: Partial<HealthLogData>) => {
        const res = await axiosClient.put(`/health/${id}`, data);
        return res.data;
    },

    /** ❌ Delete a health log */
    remove: async (id: string) => {
        const res = await axiosClient.delete(`/health/${id}`);
        return res.data;
    },
};
