// client/src/services/loggerApi.ts

"use client";

import { axiosRaw } from "./axiosClient";


export type LogLevel = "info" | "warning" | "error" | "debug";

export type LogCategory =
    | "auth"
    | "ml"
    | "ui"
    | "network"
    | "alert"
    | "summary"
    | "game"
    | "bot"
    | "journal"
    | "health"
    | "system"
    | "unknown";

export interface LogEvent {
    _id?: string;
    userId?: string; // client sends string; server schema expects ObjectId (castable if valid)
    level?: LogLevel;
    category?: LogCategory;
    message: string;
    context?: Record<string, unknown>;
    timestamp?: string; // optional; server has default Date.now
}

type LogMeta =
    | Record<string, unknown>
    | {
        userId?: string;
        category?: LogCategory;
        context?: Record<string, unknown>;
    };

function safeGet(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function isValidObjectIdString(value: unknown): value is string {
    return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}

function getStoredUserId(): string | undefined {
    try {
        const raw = safeGet("user");
        if (!raw) return undefined;
        const parsed = JSON.parse(raw) as { id?: string; _id?: string };
        const id = typeof parsed?.id === "string" ? parsed.id : typeof parsed?._id === "string" ? parsed._id : undefined;
        return isValidObjectIdString(id) ? id : undefined;
    } catch {
        return undefined;
    }
}

function normalizeMeta(meta?: LogMeta): {
    userId?: string;
    category?: LogCategory;
    context?: Record<string, unknown>;
} {
    if (!meta) return {};

    const maybe = meta as {
        userId?: string;
        category?: LogCategory;
        context?: Record<string, unknown>;
    };

    const hasStructuredKeys =
        typeof maybe.userId === "string" ||
        typeof maybe.category === "string" ||
        (typeof maybe.context === "object" && maybe.context !== null);

    if (hasStructuredKeys) {
        return {
            userId: isValidObjectIdString(maybe.userId) ? maybe.userId : undefined,
            category: maybe.category,
            context: maybe.context,
        };
    }

    return { context: meta as Record<string, unknown> };
}

/** -------------------------------------------------------
 * ✅ Dedupe + Rate-limit (prevents storms)
 * ------------------------------------------------------ */
const lastSent = new Map<string, number>();
const DEDUPE_MS = 2500;

let windowStart = Date.now();
let sentInWindow = 0;
const MAX_PER_10S = 20;

function rateLimited(): boolean {
    const now = Date.now();
    if (now - windowStart > 10_000) {
        windowStart = now;
        sentInWindow = 0;
    }
    sentInWindow += 1;
    return sentInWindow > MAX_PER_10S;
}

function shouldDedupe(level: LogLevel, category: LogCategory, message: string): boolean {
    const key = `${level}|${category}|${message}`.slice(0, 240);
    const now = Date.now();
    const prev = lastSent.get(key) ?? 0;
    if (now - prev < DEDUPE_MS) return true;
    lastSent.set(key, now);

    if (lastSent.size > 400) {
        for (const [k, t] of lastSent) if (now - t > 30_000) lastSent.delete(k);
    }
    return false;
}

export const loggerApi = {
    log: async (data: Omit<LogEvent, "_id">) => {
        const storedUserId = getStoredUserId();
        const userId = isValidObjectIdString(data.userId) ? data.userId : storedUserId;

        const level: LogLevel = data.level ?? "info";
        const category: LogCategory = data.category ?? "unknown";
        const message = data.message;

        // prevent storm
        if (rateLimited()) return { ok: false, rateLimited: true };
        if (shouldDedupe(level, category, message)) return { ok: true, deduped: true };

        // ✅ Align to your schema. If you include timestamp, send ISO (mongoose will cast).
        const payload = {
            level,
            category,
            message,
            ...(userId ? { userId } : {}),
            context: data.context ?? {},
            // Optional: remove this line if you prefer schema default Date.now
            timestamp: new Date().toISOString(),
        };

        try {
            const res = await axiosRaw.post("/logs", payload);
            return res.data;
        } catch {
            // never throw -> avoids feedback loops
            return { ok: false };
        }
    },

    warn: async (message: string, meta?: LogMeta) => {
        const { category, userId, context } = normalizeMeta(meta);
        return loggerApi.log({ level: "warning", message, category: category ?? "unknown", userId, context });
    },

    error: async (message: string, meta?: LogMeta) => {
        const { category, userId, context } = normalizeMeta(meta);
        return loggerApi.log({ level: "error", message, category: category ?? "unknown", userId, context });
    },

    debug: async (message: string, meta?: LogMeta) => {
        const { category, userId, context } = normalizeMeta(meta);
        return loggerApi.log({ level: "debug", message, category: category ?? "unknown", userId, context });
    },

    list: async (params?: {
        userId?: string;
        category?: LogCategory | string;
        level?: LogLevel | string;
        page?: number;
        limit?: number;
    }) => {
        try {
            const res = await axiosRaw.get("/logs", { params });
            return res.data;
        } catch {
            return { ok: false, data: [] };
        }
    },
};

export default loggerApi;
