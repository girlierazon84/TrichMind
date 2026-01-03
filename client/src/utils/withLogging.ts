// client/src/utils/withLogging.ts

"use client";

import { loggerApi } from "@/services";
import { safePreview } from "@/utils";


/** Types */
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

export type LogLevel = "info" | "warning" | "error" | "debug";

/** fire-and-forget */
function fireAndForget(promise: Promise<unknown>) {
    void promise.catch(() => {
        // never throw / never recurse
    });
}

/** timing helper */
function nowMs() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
    }
    return Date.now();
}

type AxiosLikeError = {
    message?: unknown;
    status?: unknown;
    code?: unknown;
    response?: {
        status?: unknown;
        data?: { message?: unknown; error?: unknown };
    };
};

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function asAxiosLikeError(err: unknown): AxiosLikeError | null {
    return isObject(err) ? (err as AxiosLikeError) : null;
}

function toOptionalNumber(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined;
}

function toOptionalString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function getRoute(): string | null {
    if (typeof window === "undefined") return null;
    return window.location?.pathname ?? null;
}

function getBrowserContext():
    | { userAgent: string; language: string; platform?: string }
    | undefined {
    if (typeof navigator === "undefined") return undefined;

    const platform =
        "platform" in navigator &&
            typeof (navigator as unknown as { platform?: unknown }).platform === "string"
            ? (navigator as unknown as { platform: string }).platform
            : undefined;

    return { userAgent: navigator.userAgent, language: navigator.language, platform };
}

function getUserContext(): { id: string | null; email: string | null } | undefined {
    if (typeof window === "undefined") return undefined;
    try {
        const raw = window.localStorage.getItem("user");
        if (!raw) return undefined;
        const parsed: unknown = JSON.parse(raw);
        if (!isObject(parsed)) return undefined;

        const id = typeof parsed.id === "string" ? parsed.id : null;
        const email = typeof parsed.email === "string" ? parsed.email : null;
        return { id, email };
    } catch {
        return undefined;
    }
}

function redact(value: unknown): unknown {
    if (!isObject(value)) return value;

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
        const key = k.toLowerCase();
        if (
            key.includes("password") ||
            key.includes("token") ||
            key.includes("refresh") ||
            key.includes("authorization")
        ) {
            out[k] = "[REDACTED]";
        } else if (isObject(v)) {
            out[k] = redact(v);
        } else {
            out[k] = v;
        }
    }
    return out;
}

function buildContext(arg: unknown) {
    return {
        route: getRoute(),
        user: getUserContext(),
        browser: getBrowserContext(),
        argsPreview: safePreview(redact(arg)),
    };
}

/** Warmup vs real failure */
function classify(err: unknown): { warmup: boolean; status?: number; message: string } {
    const e = asAxiosLikeError(err);

    const status =
        toOptionalNumber(e?.response?.status) ?? toOptionalNumber(e?.status);

    const rawMsg =
        toOptionalString(e?.response?.data?.message) ??
        toOptionalString(e?.response?.data?.error) ??
        toOptionalString(e?.message) ??
        (err instanceof Error ? err.message : undefined) ??
        "Request failed";

    const msgLower = rawMsg.toLowerCase();

    const warmup =
        status === 502 ||
        status === 503 ||
        status === 504 ||
        msgLower.includes("timeout") ||
        msgLower.includes("network error") ||
        msgLower.includes("failed to fetch") ||
        msgLower.includes("mongo") ||
        msgLower.includes("not ready") ||
        msgLower.includes("starting up");

    return { warmup, status, message: rawMsg };
}

/** ---------------------------------------------
 * ✅ Dedupe (last line of defense)
 * -------------------------------------------- */
const recent = new Map<string, number>();
const DEDUPE_WINDOW_MS = 2000;

function shouldSkip(level: LogLevel, category: LogCategory, message: string) {
    const key = `${level}|${category}|${message}`.slice(0, 240);
    const now = Date.now();
    const last = recent.get(key) ?? 0;
    if (now - last < DEDUPE_WINDOW_MS) return true;
    recent.set(key, now);

    if (recent.size > 300) {
        for (const [k, t] of recent) if (now - t > 10_000) recent.delete(k);
    }
    return false;
}

/** Skip noisy auth chatter */
function shouldSkipByStatus(status?: number, messageLower?: string) {
    if (status === 401) return true; // token refresh / auth chatter
    if (messageLower?.includes("token expired")) return true;
    return false;
}

/** IMPORTANT: success logging is OFF by default */
const LOG_SUCCESS_DEFAULT = false;

export function withLogging<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    meta?: {
        category?: LogCategory;
        action?: string;

        onSuccess?: (msg: string) => void;
        onError?: (msg: string) => void;
        onWarmup?: (msg: string) => void;

        successMessage?: string;
        errorMessage?: string;
        warmupMessage?: string;

        /** ✅ enable success logs only where you really want them */
        logSuccess?: boolean;

        /** ✅ hard disable any auto logging */
        disableAutoLog?: boolean;
    }
): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
        const start = nowMs();
        const endpoint = meta?.action || (fn.name ? fn.name.replace(/^bound\s*/, "") : "anonymous");
        const ctx = buildContext(args[0]);
        const userId = ctx.user?.id ?? undefined;

        const disableAutoLog = meta?.disableAutoLog === true;

        try {
            const result = await fn(...args);
            const duration = Math.round(nowMs() - start);

            const logSuccess = meta?.logSuccess ?? LOG_SUCCESS_DEFAULT;

            if (!disableAutoLog && logSuccess) {
                const level: LogLevel = "info";
                const category: LogCategory = meta?.category ?? "network";
                const message = `${endpoint} ok`;

                if (!shouldSkip(level, category, message)) {
                    fireAndForget(
                        loggerApi.log({
                            level,
                            category,
                            message,
                            userId,
                            context: { ...ctx, duration_ms: duration, endpoint, action: meta?.action },
                        })
                    );
                }
            }

            if (meta?.onSuccess && meta?.successMessage) meta.onSuccess(meta.successMessage);
            return result;
        } catch (err: unknown) {
            const duration = Math.round(nowMs() - start);
            const info = classify(err);

            const msgLower = (info.message || "").toLowerCase();
            const noisy = shouldSkipByStatus(info.status, msgLower);

            if (!disableAutoLog && !noisy) {
                const baseCategory: LogCategory = meta?.category ?? "network";
                const category: LogCategory = info.warmup ? "system" : baseCategory;
                const level: LogLevel = "error";
                const message = info.warmup ? `${endpoint} warmup` : `${endpoint} failed`;

                if (!shouldSkip(level, category, message)) {
                    fireAndForget(
                        loggerApi.log({
                            level,
                            category,
                            message,
                            userId,
                            context: {
                                ...ctx,
                                duration_ms: duration,
                                status: info.status,
                                endpoint,
                                action: meta?.action,
                                warmup: info.warmup,
                                error: info.message,
                            },
                        })
                    );
                }
            }

            if (info.warmup) meta?.onWarmup?.(meta?.warmupMessage ?? "Server warming up.");
            else meta?.onError?.(meta?.errorMessage ?? info.message);

            throw err;
        }
    };
}

export default withLogging;
