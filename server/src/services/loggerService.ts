// server/src/services/loggerService.ts

import { LogEvent, ILogEvent } from "../models";

/**-------------------------------------------------------------------------
🧠 loggerService
Unified backend logging for TrichMind platform.
Can be used in controllers, jobs, or middleware.
Example:
await loggerService.logInfo("ML prediction completed", { model: "v2.0" });
----------------------------------------------------------------------------**/
export const loggerService = {
    //🪵 Generic logger
    async log(
        message: string,
        level: ILogEvent["level"] = "info",
        category: ILogEvent["category"] = "system",
        context: Record<string, any> = {},
        userId?: string
    ) {
        try {
            // Create log entry in DB
            const entry = await LogEvent.create({
                message,
                level,
                category,
                context,
                userId,
                timestamp: new Date(),
            });

            // Optional: print to console in dev
            if (process.env.NODE_ENV !== "production") {
                const color =
                    level === "error"
                        ? "\x1b[31m"
                        : level === "warning"
                            ? "\x1b[33m"
                            : "\x1b[36m";
                console.log(
                    `${color}[${level.toUpperCase()}][${category}] ${message}\x1b[0m`
                );
            }

            return entry;
        } catch (err: any) {
            console.error("❌ Failed to log event:", err.message);
        }
    },

    // ℹ️ Info-level logs
    async logInfo(message: string, context: Record<string, any> = {}, userId?: string) {
        return this.log(message, "info", "system", context, userId);
    },

    //⚠️ Warning-level logs
    async logWarning(message: string, context: Record<string, any> = {}, userId?: string) {
        return this.log(message, "warning", "system", context, userId);
    },

    // ❌ Error-level logs
    async logError(message: string, context: Record<string, any> = {}, userId?: string) {
        return this.log(message, "error", "system", context, userId);
    },

    // 🧩 ML-specific logs
    async logML(message: string, context: Record<string, any> = {}, userId?: string) {
        return this.log(message, "info", "ml", context, userId);
    },

    // 🔐 Auth-specific logs
    async logAuth(message: string, context: Record<string, any> = {}, userId?: string) {
        return this.log(message, "info", "auth", context, userId);
    },
};

export default loggerService;
