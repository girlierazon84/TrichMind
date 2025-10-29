// client/src/api/alertApi.ts

import { axiosClient } from "./axiosClient";

export interface AlertLog {
    _id?: string;
    userId?: string;
    score: number;
    triggeredAt?: string;
    sent?: boolean;
    email?: string;
    error?: string;
    createdAt?: string;
}

/**
 * 🚨 Alert API — manages relapse risk alert logs.
 * Backend: /api/alerts
 */
export const alertApi = {
    /** 📩 Log a new alert event */
    create: async (data: Omit<AlertLog, "_id" | "createdAt">) => {
        const res = await axiosClient.post("/alerts", data);
        return res.data;
    },

    /** 📋 Get all alerts for the user */
    list: async (params?: { page?: number; limit?: number }) => {
        const res = await axiosClient.get("/alerts", { params });
        return res.data;
    },

    /** 🔎 Get a single alert by ID */
    getById: async (id: string) => {
        const res = await axiosClient.get(`/alerts/${id}`);
        return res.data;
    },

    /** ✅ Mark alert as sent (or toggle sent status) */
    markAsSent: async (id: string, sent = true) => {
        const res = await axiosClient.patch(`/alerts/${id}`, { sent });
        return res.data;
    },

    /** ❌ Delete alert log */
    remove: async (id: string) => {
        const res = await axiosClient.delete(`/alerts/${id}`);
        return res.data;
    },
};
