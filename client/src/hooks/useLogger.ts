// client/src/hooks/useLogger.ts

"use client";

import { useCallback } from "react";
import { toast } from "react-toastify";
import { loggerApi, type LogEvent } from "@/services";


export const useLogger = (showToasts = false) => {
    const log = useCallback(
        async (message: string, context?: LogEvent["context"]) => {
            try {
                await loggerApi.log({ message, context });
            } catch { }
            if (showToasts) toast.info(message);
        },
        [showToasts]
    );

    const warn = useCallback(
        async (message: string, context?: LogEvent["context"]) => {
            try {
                await loggerApi.warn(message, context ?? {});
            } catch { }
            if (showToasts) toast.warning(message);
        },
        [showToasts]
    );

    const error = useCallback(
        async (message: string, context?: LogEvent["context"]) => {
            try {
                await loggerApi.error(message, context ?? {});
            } catch { }
            if (showToasts) toast.error(message);
        },
        [showToasts]
    );

    const list = useCallback(
        (params?: Parameters<typeof loggerApi.list>[0]) => loggerApi.list(params),
        []
    );

    return { log, warn, error, list };
};

export default useLogger;
