// server/src/services/loggerService.ts

import { LogEvent, type ILogEvent } from "../models";


/**-------------------------------------------------------------
    🧠 loggerService
    Unified backend logging for TrichMind platform.

    ✅ Key updates:
        - category is explicit (default "system")
        - convenience methods allow overriding category
        - never throws (logging must never break main flow)
----------------------------------------------------------------*/

// Define types for log level and category
type LogLevel = ILogEvent["level"];
type LogCategory = ILogEvent["category"];

// Main logger service object
export const loggerService = {
    // Main logging method (never throws)
    async log(
        message: string,
        level: LogLevel = "info",
        category: LogCategory = "system",
        context: Record<string, unknown> = {},
        userId?: string
    ) {
        // Attempt to create log entry
        try {
            const entry = await LogEvent.create({
                message,
                level,
                category,
                context,
                userId,
                timestamp: new Date(),
            });

            // In non-production, also log to console with colors
            if (process.env.NODE_ENV !== "production") {
                const color =
                    level === "error"
                        ? "\x1b[31m"
                        : level === "warning"
                        ? "\x1b[33m"
                        : "\x1b[36m";

                // eslint-disable-next-line no-console
                console.log(
                    `${color}[${level.toUpperCase()}][${category}] ${message}\x1b[0m`,
                    Object.keys(context).length ? context : ""
                );
            }

            return entry;
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error("❌ Failed to log event:", err?.message ?? String(err));
            return undefined;
        }
    },

    // Level-specific shorthands (category override still supported)
    async logInfo(
        message: string,
        context: Record<string, unknown> = {},
        category: LogCategory = "system",
        userId?: string
    ) {
        return this.log(message, "info", category, context, userId);
    },

    // Warning level logger
    async logWarning(
        message: string,
        context: Record<string, unknown> = {},
        category: LogCategory = "system",
        userId?: string
    ) {
        return this.log(message, "warning", category, context, userId);
    },

    // Error level logger
    async logError(
        message: string,
        context: Record<string, unknown> = {},
        category: LogCategory = "system",
        userId?: string
    ) {
        return this.log(message, "error", category, context, userId);
    },

    // Convenience category shorthands
    async logML(message: string, context: Record<string, unknown> = {}, userId?: string) {
        return this.log(message, "info", "ml", context, userId);
    },

    // Auth category logger
    async logAuth(message: string, context: Record<string, unknown> = {}, userId?: string) {
        return this.log(message, "info", "auth", context, userId);
    },
};

export default loggerService;
