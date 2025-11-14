// client/src/services/healthApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


export interface HealthLogData {
    sleepHours: number;
    stressLevel: number;
    exerciseMinutes: number;
    date?: string;
}

// ───────────── Base Functions ─────────────
async function rawCreate(data: HealthLogData) {
    const res = await axiosClient.post("/api/health", data);
    return res.data;
}

async function rawList(params?: { from?: string; to?: string; page?: number; limit?: number }) {
    const res = await axiosClient.get("/api/health", { params });
    return res.data;
}

async function rawGetById(id: string) {
    const res = await axiosClient.get(`/api/health/${id}`);
    return res.data;
}

async function rawUpdate(id: string, data: Partial<HealthLogData>) {
    const res = await axiosClient.put(`/api/health/${id}`, data);
    return res.data;
}

async function rawRemove(id: string) {
    const res = await axiosClient.delete(`/api/health/${id}`);
    return res.data;
}

// ───────────── Wrapped with Logging ─────────────
export const healthApi = {
    create: withLogging(rawCreate, {
        category: "ui",
        action: "healthCreate",
        showToast: true,
        successMessage: "Health log created successfully!",
        errorMessage: "Failed to log health entry.",
    }),
    list: withLogging(rawList, { category: "ui", action: "healthList" }),
    getById: withLogging(rawGetById, { category: "ui", action: "healthGet" }),
    update: withLogging(rawUpdate, {
        category: "ui",
        action: "healthUpdate",
        showToast: true,
        successMessage: "Health log updated!",
        errorMessage: "Failed to update health log.",
    }),
    remove: withLogging(rawRemove, {
        category: "ui",
        action: "healthRemove",
        showToast: true,
        successMessage: "Health log deleted.",
        errorMessage: "Failed to delete health log.",
    }),
};
