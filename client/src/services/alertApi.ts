// client/src/services/alertApi.ts

import { axiosClient } from "./axiosClient";
import { withLogging } from "@/utils/withLogging";
import type { LogEvent } from "@/services/loggerApi";

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
 * Backend endpoint: `/api/alerts`
 */
async function rawCreate(
    data: Omit<AlertLog, "_id" | "createdAt">
) {
    const res = await axiosClient.post("/alerts", data);
    return res.data;
}

async function rawList(params?: { page?: number; limit?: number }) {
    const res = await axiosClient.get("/alerts", { params });
    return res.data;
}

async function rawGetById(id: string) {
    const res = await axiosClient.get(`/alerts/${id}`);
    return res.data;
}

async function rawMarkAsSent(id: string, sent = true) {
    const res = await axiosClient.patch(`/alerts/${id}`, { sent });
    return res.data;
}

async function rawRemove(id: string) {
    const res = await axiosClient.delete(`/alerts/${id}`);
    return res.data;
}

export const alertApi = {
    create: withLogging(rawCreate, {
        category: "alert" as LogEvent["category"],
        action: "create",
        showToast: true,
        successMessage: "Alert successfully logged.",
        errorMessage: "Failed to create alert.",
    }),

    list: withLogging(rawList, {
        category: "alert",
        action: "list",
    }),

    getById: withLogging(rawGetById, {
        category: "alert",
        action: "getById",
    }),

    markAsSent: withLogging(rawMarkAsSent, {
        category: "alert",
        action: "markAsSent",
        showToast: true,
        successMessage: "Alert marked as sent.",
        errorMessage: "Failed to update alert status.",
    }),

    remove: withLogging(rawRemove, {
        category: "alert",
        action: "remove",
        showToast: true,
        successMessage: "Alert removed.",
        errorMessage: "Failed to delete alert.",
    }),
};
