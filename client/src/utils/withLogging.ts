// client/src/utils/withLogging.ts

import { loggerApi, type LogEvent } from "@/services/loggerApi";
import { toast } from "react-toastify";
import { safePreview } from "@/utils/safePreview";

/**
 * 🌐 withLogging — wraps async API calls with automatic backend + UI logging
 * Automatically adds:
 *  - User context (from localStorage)
 *  - Route path (from window.location)
 *  - Browser/device info
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
        const endpoint =
            meta?.action || (fn.name ? fn.name.replace(/^bound\s*/, "") : "anonymous");

        // Automatically extract environment + user context
        const context = buildContext(args[0]);

        try {
            const result = await fn(...args);
            const duration = Math.round(performance.now() - start);

            // 🧾 Log success
            await loggerApi.log({
                level: "info",
                category: meta?.category ?? "network",
                message: `${endpoint} request successful`,
                context: {
                    ...context,
                    duration_ms: duration,
                    endpoint,
                },
            });

            // 🧠 Optional toast feedback
            if (meta?.showToast && meta?.successMessage) {
                toast.success(meta.successMessage);
            }

            return result;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const duration = Math.round(performance.now() - start);

            await loggerApi.error(`${endpoint} request failed`, {
                category: meta?.category ?? "network",
                duration_ms: duration,
                error: msg,
                ...context,
            });

            // 🚨 Optional toast feedback
            if (meta?.showToast) {
                toast.error(meta?.errorMessage ?? "Something went wrong");
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
        const user = JSON.parse(raw);
        return {
            id: user?.id ?? null,
            email: user?.email ?? null,
        };
    } catch {
        return undefined;
    }
}

/** 💻 Retrieve basic browser + device info */
function getBrowserContext() {
    if (typeof navigator === "undefined") return undefined;
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
    };
}
