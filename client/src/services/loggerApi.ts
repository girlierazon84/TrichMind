// client/src/services/loggerApi.ts

import { axiosClient } from "@/services";


/**---------------------
    Log event schema
------------------------*/
export interface LogEvent {
    _id?: string;
    userId?: string;
    level?: "info" | "warning" | "error" | "debug";
    category?:
    | "auth"
    | "ml"
    | "ui"
    | "network"
    | "alert"
    | "summary"
    | "system"
    | "unknown"
    | "server_warming_up";
    message: string;
    context?: Record<string, unknown>;
    timestamp?: string;
}

/** Allow passing either plain context or richer metadata */
type LogMeta =
    | Record<string, unknown>
    | {
        userId?: string;
        category?: LogEvent["category"];
        context?: Record<string, unknown>;
    };

function getStoredUserId(): string | undefined {
    try {
        const raw = localStorage.getItem("user");
        if (!raw) return undefined;
        const user = JSON.parse(raw) as { id?: string };
        return typeof user?.id === "string" ? user.id : undefined;
    } catch {
        return undefined;
    }
}

function normalizeMeta(meta?: LogMeta): {
    userId?: string;
    category?: LogEvent["category"];
    context?: Record<string, unknown>;
} {
    if (!meta) return {};

    const maybe = meta as {
        userId?: string;
        category?: LogEvent["category"];
        context?: Record<string, unknown>;
    };

    const hasStructuredKeys =
        typeof maybe.userId === "string" ||
        typeof maybe.category === "string" ||
        (typeof maybe.context === "object" && maybe.context !== null);

    if (hasStructuredKeys) {
        return {
            userId: maybe.userId,
            category: maybe.category,
            context: maybe.context,
        };
    }

    return { context: meta as Record<string, unknown> };
}

/**-----------------------------------------------------------------------------------------
    🧾 Logger API — centralized logging for frontend events, model activity, and alerts
--------------------------------------------------------------------------------------------*/
export const loggerApi = {
    // Log a generic event (info/debug)
    log: async (data: Omit<LogEvent, "_id" | "timestamp">) => {
        const userId = data.userId ?? getStoredUserId();
        const category: LogEvent["category"] = data.category ?? "unknown";

        const res = await axiosClient.post("/logs", {
            level: data.level || "info",
            timestamp: new Date().toISOString(),
            ...data,
            userId,
            category,
        });

        return res.data;
    },

    // ⚠️ Log a warning (supports: warn(msg, context) OR warn(msg, {category,userId,context}))
    warn: async (message: string, meta?: LogMeta) => {
        const { category, userId, context } = normalizeMeta(meta);
        return loggerApi.log({
            level: "warning",
            message,
            category: category ?? "unknown",
            userId,
            context,
        });
    },

    // ❌ Log an error (supports: error(msg, context) OR error(msg, {category,userId,context}))
    error: async (message: string, meta?: LogMeta) => {
        const { category, userId, context } = normalizeMeta(meta);
        return loggerApi.log({
            level: "error",
            message,
            category: category ?? "unknown",
            userId,
            context,
        });
    },

    // 💬 Retrieve logs (for dashboards or admin views)
    list: async (params?: {
        userId?: string;
        category?: string;
        level?: string;
        page?: number;
        limit?: number;
    }) => {
        const res = await axiosClient.get("/logs", { params });
        return res.data;
    },
};

export default loggerApi;
