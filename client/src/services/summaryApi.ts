// client/src/services/summaryApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


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

async function rawCreate(data: Omit<SummaryLog, "_id" | "createdAt">) {
    const res = await axiosClient.post("/api/summary", data);
    return res.data;
}

async function rawList(params?: { page?: number; limit?: number; sort?: string }) {
    const res = await axiosClient.get("/api/summary", { params });
    return res.data;
}

export const summaryApi = {
    create: withLogging(rawCreate, {
        category: "summary",
        action: "createSummary",
        showToast: true,
        successMessage: "Weekly summary generated!",
    }),
    list: withLogging(rawList, { category: "summary", action: "listSummaries" }),
};
