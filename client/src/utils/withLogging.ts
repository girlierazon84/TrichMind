// client/src/utils/withLogging.ts

import type { AxiosError } from "axios";
import { loggerApi, type LogEvent } from "@/services/loggerApi";
import { toast } from "react-toastify";
import { safePreview } from "@/utils/safePreview";
import { isRetryable, type ErrorResponseBody } from "@/services/axiosClient";


/**------------------------------------------
    Fire-and-forget helper – NEVER throws
---------------------------------------------*/
function fireAndForget(promise: Promise<unknown>) {
    void promise.catch((err: unknown) => {
        const message =
            err instanceof Error ? err.message : String(err ?? "Unknown error");
        // Never break UI flow because logging failed
        console.warn("[withLogging] Failed to send log:", message);
    });
}

/**-------------------------------------------------------------
    Distinguish cold start / DB not ready from real failures
----------------------------------------------------------------*/
function classifyNetworkIssue(
    err: unknown
): {
    isWarmup: boolean;
    status?: number;
    message: string;
    backendMessage?: string;
} {
    const axiosErr = err as AxiosError<ErrorResponseBody> | undefined;

    const status = axiosErr?.response?.status;
    const backendMessage =
        axiosErr?.response?.data?.message || axiosErr?.response?.data?.error;

    // baseline message
    let message =
        (typeof backendMessage === "string" && backendMessage) ||
        (err instanceof Error && err.message) ||
        "Request failed";

    // treat these as warmup / transient
    const warmup =
        status === 503 ||
        status === 502 ||
        status === 504 ||
        (axiosErr ? isRetryable(axiosErr) : false) ||
        message.toLowerCase().includes("timeout") ||
        message.toLowerCase().includes("network error");

    if (warmup) {
        // user-friendly message (don’t scare users)
        message = "Server is waking up — please try again in a moment.";
    }

    return { isWarmup: warmup, status, message, backendMessage };
}

/**--------------------------------------------------------------------------------
    🌐 withLogging — wraps async API calls with automatic backend + UI logging
-----------------------------------------------------------------------------------*/
export function withLogging<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    meta?: {
        category?: LogEvent["category"];
        action?: string;
        showToast?: boolean;
        successMessage?: string;
        errorMessage?: string;
        warmupMessage?: string; // optional override text for warmup
    }
): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
        const start = performance.now();

        const endpoint =
            meta?.action ||
            (fn.name ? fn.name.replace(/^bound\s*/, "") : "anonymous");

        const ctx = buildContext(args[0]);

        try {
            const result = await fn(...args);
            const duration = Math.round(performance.now() - start);

            // ✅ success log
            fireAndForget(
                loggerApi.log({
                    level: "info",
                    category: meta?.category ?? "network",
                    message: `${endpoint} request successful`,
                    userId: ctx.user?.id ?? undefined,
                    context: {
                        ...ctx,
                        duration_ms: duration,
                        endpoint,
                        action: meta?.action,
                    },
                })
            );

            if (meta?.showToast && meta?.successMessage) {
                toast.success(meta.successMessage);
            }

            return result;
        } catch (err: unknown) {
            const duration = Math.round(performance.now() - start);

            const info = classifyNetworkIssue(err);
            const category = meta?.category ?? "network";

            // ✅ Don’t spam scary “failed” titles for warmup
            const logMessage = info.isWarmup
                ? `${endpoint} server_warming_up`
                : `${endpoint} request failed`;

            // ✅ IMPORTANT: loggerApi.error(message, meta)
            // meta must be { category, userId, context } to keep category top-level
            fireAndForget(
                loggerApi.error(logMessage, {
                    category: info.isWarmup ? "server_warming_up" : category,
                    userId: ctx.user?.id ?? undefined,
                    context: {
                        ...ctx,
                        duration_ms: duration,
                        status: info.status,
                        endpoint,
                        action: meta?.action,
                        // store raw error message for debugging
                        error:
                            info.backendMessage ||
                            (err instanceof Error ? err.message : "Unknown error"),
                        warmup: info.isWarmup,
                    },
                })
            );

            // ✅ Optional toast feedback
            if (meta?.showToast) {
                if (info.isWarmup) {
                    toast.info(meta?.warmupMessage ?? info.message);
                } else {
                    toast.error(meta?.errorMessage ?? info.message);
                }
            }

            throw err;
        }
    };
}

// Build common context for logging
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

// Get user info from localStorage if available
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

// Get basic browser info if in browser context
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
