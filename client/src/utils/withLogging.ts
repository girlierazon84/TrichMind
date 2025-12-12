// client/src/utils/withLogging.ts

import type { AxiosError } from "axios";
import { loggerApi, type LogEvent } from "@/services/loggerApi";
import { toast } from "react-toastify";
import { safePreview } from "@/utils/safePreview";


/** Shape of error payloads we expect from backend */
interface ErrorResponseBody {
    message?: string;
    error?: string;
}

/** --------------------------------------------------
 * Fire-and-forget helper – NEVER throws
 * ------------------------------------------------- */
function fireAndForget(promise: Promise<unknown>) {
    void promise.catch((err: unknown) => {
        const message =
            err instanceof Error ? err.message : String(err ?? "Unknown error");
        // We only log to console; we never break the main flow
        console.warn("[withLogging] Failed to send log:", message);
    });
}

/**
 * 🌐 withLogging — wraps async API calls with automatic backend + UI logging
 * Automatically adds:
 *  - User context (from localStorage)
 *  - Route path (from window.location)
 *  - Browser/device info
 *
 * Logging is **non-blocking** and **never throws** if /api/logs fails.
 *
 * @param fn   The async API function to wrap
 * @param meta Optional metadata (category, action, toast messages)
 */
export function withLogging<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    meta?: {
        category?: LogEvent["category"];
        action?: string;
        showToast?: boolean;
        successMessage?: string;
        errorMessage?: string;
    }
): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
        const start = performance.now();

        // Use explicit action if provided, else fall back to function name
        const endpoint =
            meta?.action || (fn.name ? fn.name.replace(/^bound\s*/, "") : "anonymous");

        // Automatically extract environment + user context
        const context = buildContext(args[0]);

        try {
            const result = await fn(...args);
            const duration = Math.round(performance.now() - start);

            // 🧾 Log success (non-blocking, safe)
            fireAndForget(
                loggerApi.log({
                    level: "info",
                    category: meta?.category ?? "network",
                    message: `${endpoint} request successful`,
                    context: {
                        ...context,
                        duration_ms: duration,
                        endpoint,
                        action: meta?.action,
                    },
                })
            );

            // 🧠 Optional toast feedback
            if (meta?.showToast && meta?.successMessage) {
                toast.success(meta.successMessage);
            }

            return result;
        } catch (err: unknown) {
            const duration = Math.round(performance.now() - start);

            let msg = "Request failed";

            // Try to surface meaningful backend / Axios message
            if (err instanceof Error) {
                msg = err.message || msg;
            }

            const axiosErr = err as AxiosError<ErrorResponseBody> | undefined;
            const data = axiosErr?.response?.data;
            if (data) {
                const derived =
                    (typeof data.message === "string" && data.message) ||
                    (typeof data.error === "string" && data.error);
                if (derived) {
                    msg = derived;
                }
            }

            // 🧾 Log error (non-blocking, safe)
            fireAndForget(
                loggerApi.error(`${endpoint} request failed`, {
                    category: meta?.category ?? "network",
                    duration_ms: duration,
                    error: msg,
                    endpoint,
                    action: meta?.action,
                    ...context,
                })
            );

            // 🚨 Optional toast feedback
            if (meta?.showToast) {
                toast.error(meta?.errorMessage ?? msg);
            }

            throw err;
        }
    };
}

/**
 * 🧠 Build unified context for all logs
 * Includes:
 *  - User (from localStorage)
 *  - Current route
 *  - Browser info
 *  - First argument preview
 */
function buildContext(arg: unknown) {
    const userContext = getUserContext();
    const browserContext = getBrowserContext();
    const route = typeof window !== "undefined" ? window.location.pathname : null;

    return {
        route,
        user: userContext,
        browser: browserContext,
        argsPreview: safePreview(arg),
    };
}

/** 🧍 Retrieve minimal user info (from localStorage or future global store) */
function getUserContext(): Record<string, string | null> | undefined {
    try {
        const raw = localStorage.getItem("user");
        if (!raw) return undefined;
        const user = JSON.parse(raw) as { id?: string; email?: string };
        return {
            id: user?.id ?? null,
            email: user?.email ?? null,
        };
    } catch {
        return undefined;
    }
}

/** 💻 Retrieve basic browser + device info */
function getBrowserContext():
    | { userAgent: string; language: string; platform: string }
    | undefined {
    if (typeof navigator === "undefined") return undefined;
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
    };
}
