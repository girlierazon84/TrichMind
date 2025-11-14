// client/src/services/loggerApi.ts

import { axiosClient } from "@/services";


/** Log event schema */
export interface LogEvent {
    _id?: string;
    userId?: string;
    level?: "info" | "warning" | "error" | "debug";
    category?: "auth" | "ml" | "ui" | "network" | "alert" | "summary" | "system";
    message: string;
    context?: Record<string, unknown>;
    timestamp?: string;
}

/**
 * 🧾 Logger API — centralized logging for frontend events, model activity, and alerts
 * Backend endpoint: `/api/logs`
 */
export const loggerApi = {
    /** 🪵 Log a generic event (info/debug) */
    log: async (data: Omit<LogEvent, "_id" | "timestamp">) => {
        const res = await axiosClient.post("/api/logs", {
            level: data.level || "info",
            timestamp: new Date().toISOString(),
            ...data,
        });
        return res.data;
    },

    /** ⚠️ Log a warning */
    warn: async (message: string, context?: Record<string, unknown>) => {
        return loggerApi.log({ level: "warning", message, context });
    },

    /** ❌ Log an error */
    error: async (message: string, context?: Record<string, unknown>) => {
        return loggerApi.log({ level: "error", message, context });
    },

    /** 💬 Retrieve logs (for dashboards or admin views) */
    list: async (params?: {
        userId?: string;
        category?: string;
        level?: string;
        page?: number;
        limit?: number;
    }) => {
        const res = await axiosClient.get("/api/logs", { params });
        return res.data;
    },
};
