// client/src/api/summaryApi.ts

import { axiosClient } from "./axiosClient";

export interface SummaryLog {
    _id?: string;
    userId?: string;
    weekOf: string;
    avgRisk?: number;
    topCoping?: string;
    streakDays?: number;
    totalSessions?: number;
    sentAt?: string;
    status?: "sent" | "failed";
    createdAt?: string;
}

/**
 * 📊 Summary API — weekly relapse risk summaries.
 * Backend: /api/summary
 */
export const summaryApi = {
    /** 🧾 Create a new weekly summary */
    create: async (data: Omit<SummaryLog, "_id" | "createdAt">) => {
        const res = await axiosClient.post("/summary", data);
        return res.data;
    },

    /** 📅 Fetch all weekly summaries */
    list: async (params?: { page?: number; limit?: number; sort?: string }) => {
        const res = await axiosClient.get("/summary", { params });
        return res.data;
    },

    /** 🔍 Get a specific summary by ID */
    getById: async (id: string) => {
        const res = await axiosClient.get(`/summary/${id}`);
        return res.data;
    },

    /** ✏️ Update existing summary log */
    update: async (id: string, data: Partial<SummaryLog>) => {
        const res = await axiosClient.put(`/summary/${id}`, data);
        return res.data;
    },

    /** ❌ Delete summary log */
    remove: async (id: string) => {
        const res = await axiosClient.delete(`/summary/${id}`);
        return res.data;
    },
};
