// client/src/utils/withLogging.ts

import { loggerApi, type LogEvent } from "@/services/loggerApi";
import { toast } from "react-toastify";

/**
 * 🌐 withLogging — wraps async API calls with automatic backend + UI logging
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

        try {
            const result = await fn(...args);
            const duration = Math.round(performance.now() - start);

            // 🧾 Log success event
            await loggerApi.log({
                level: "info",
                category: meta?.category ?? "network",
                message: `${endpoint} request successful`,
                context: {
                    duration_ms: duration,
                    endpoint,
                    argsPreview: safePreview(args[0]),
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
                argsPreview: safePreview(args[0]),
            });

            // 🚨 Optional toast feedback
            if (meta?.showToast) {
                toast.error(meta?.errorMessage ?? "Something went wrong");
            }

            throw err;
        }
    };
}

/** 🧩 Safely preview first argument (avoid large or sensitive data) */
function safePreview(value: unknown): unknown {
    try {
        if (typeof value === "object" && value !== null) {
            const shallow = Object.fromEntries(Object.entries(value).slice(0, 5));
            return shallow;
        }
        return value;
    } catch {
        return "[unserializable]";
    }
}
