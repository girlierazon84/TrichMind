// client/src/hooks/useLogger.ts

import { useCallback } from "react";
import { toast } from "react-toastify"; // ✅ you'll need `npm i react-toastify`
import { loggerApi, type LogEvent} from "@/services/loggerApi";


/**
 * 🎯 useLogger — React hook for logging and visual feedback
 * Logs to backend + shows toasts (optional)
 */
export function useLogger(showToasts = true) {
    /** 🪵 Info / Debug Log */
    const log = useCallback(
        async (message: string, context?: LogEvent["context"]) => {
            await loggerApi.log({ message, context });
            if (showToasts) toast.info(message);
        },
        [showToasts]
    );

    /** ⚠️ Warning Log */
    const warn = useCallback(
        async (message: string, context?: LogEvent["context"]) => {
            await loggerApi.warn(message, context);
            if (showToasts) toast.warning(message);
        },
        [showToasts]
    );

    /** ❌ Error Log */
    const error = useCallback(
        async (message: string, context?: LogEvent["context"]) => {
            await loggerApi.error(message, context);
            if (showToasts) toast.error(message);
        },
        [showToasts]
    );

    /** 💬 Retrieve Logs (for dashboards/admin) */
    const list = useCallback(
        (params?: Parameters<typeof loggerApi.list>[0]) => loggerApi.list(params),
        []
    );

    return { log, warn, error, list };
}
