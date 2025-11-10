// client/src/hooks/useLogger.ts

import { useCallback } from "react";
import { loggerApi } from "@/services/loggerApi";
import type { LogEvent } from "@/services/loggerApi";

/**
 * 🎯 useLogger — React hook wrapper around logger API
 * Provides simple methods for logging and retrieving logs
 */
export function useLogger() {
    const log = useCallback(
        (message: string, context?: LogEvent["context"]) =>
            loggerApi.log({ message, context }),
        []
    );

    const warn = useCallback(
        (message: string, context?: LogEvent["context"]) =>
            loggerApi.warn(message, context),
        []
    );

    const error = useCallback(
        (message: string, context?: LogEvent["context"]) =>
            loggerApi.error(message, context),
        []
    );

    const list = useCallback(
        (params?: Parameters<typeof loggerApi.list>[0]) => loggerApi.list(params),
        []
    );

    return { log, warn, error, list };
}
