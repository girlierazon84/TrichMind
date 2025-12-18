// server/src/utils/logger.ts

import fs from "fs";
import path from "path";
import util from "util";
import { ENV } from "../config/env"; // ✅ avoids circular import


// Determine log directory dynamically from ENV
const LOG_DIR = path.resolve(process.cwd(), ENV.LOG_DIR || "./logs");

// Create logs directory if it doesn’t exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Daily log file rotation
const date = new Date().toISOString().split("T")[0];
const LOG_FILE = path.join(LOG_DIR, `trichmind-${date}.log`);

/**-------------------------------------------------
    Redact sensitive keys in logged objects
----------------------------------------------------*/
const REDACT_KEYS = new Set([
    "password",
    "oldPassword",
    "newPassword",
    "currentPassword",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
    "cookie",
]);

// Deeply redacts sensitive fields in an object
function redactDeep(value: unknown, depth = 4): unknown {
    // Base case
    if (depth <= 0) return value;

    // Handle arrays
    if (Array.isArray(value)) {
        return value.map((v) => redactDeep(v, depth - 1));
    }

    // Handle objects
    if (value && typeof value === "object") {
        const obj = value as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
            out[k] = REDACT_KEYS.has(k) ? "[REDACTED]" : redactDeep(v, depth - 1);
        }
        return out;
    }

    return value;
}

/**------------------------------------------------------------------------------
    Formats and writes log messages with timestamps, environment, and levels.
---------------------------------------------------------------------------------**/
function write(
    level: "info" | "warn" | "error",
    message: unknown,
    meta?: Record<string, unknown>
): void {
    const timestamp = new Date().toISOString();
    const env = (ENV.NODE_ENV || "development").toUpperCase();

    const safeMsg =
        typeof message === "object" && message !== null ? redactDeep(message) : message;

    const safeMeta =
        meta && typeof meta === "object" ? (redactDeep(meta) as Record<string, unknown>) : undefined;

    const msgStr =
        typeof safeMsg === "string" ? safeMsg : util.inspect(safeMsg, { depth: 4 });

    const metaStr =
        safeMeta && Object.keys(safeMeta).length > 0
            ? ` | meta=${util.inspect(safeMeta, { depth: 4 })}`
            : "";

    const formatted = `[${timestamp}] [${env}] [${level.toUpperCase()}] ${msgStr}${metaStr}\n`;

    // --- Console output (with colors) ---
    const colors: Record<string, string> = {
        info: "\x1b[36m", // cyan
        warn: "\x1b[33m", // yellow
        error: "\x1b[31m", // red
        reset: "\x1b[0m",
    };

    if (level === "error")
        console.error(colors.error + formatted.trim() + colors.reset);
    else if (level === "warn")
        console.warn(colors.warn + formatted.trim() + colors.reset);
    else console.log(colors.info + formatted.trim() + colors.reset);

    // --- File logging ---
    try {
        fs.appendFileSync(LOG_FILE, formatted, "utf8");
    } catch (err) {
        console.error("❌ Failed to write log file:", (err as Error).message);
    }
}

/**---------------------------------------------------------------------
    🧠 Smart logger with info, warn, error + meta/context support
------------------------------------------------------------------------*/
export const logger = {
    info: (msg: unknown, meta?: Record<string, unknown>) => write("info", msg, meta),
    warn: (msg: unknown, meta?: Record<string, unknown>) => write("warn", msg, meta),
    error: (msg: unknown, meta?: Record<string, unknown>) => write("error", msg, meta),
};

/**-------------------------------------------------
    Optional utility for structured log contexts
----------------------------------------------------*/
export const logWithContext = (
    level: "info" | "warn" | "error",
    context: string,
    message: unknown,
    meta?: Record<string, unknown>
) => {
    write(level, `[${context}] ${typeof message === "string" ? message : util.inspect(message)}`, meta);
};

export default {
    logger,
    logWithContext,
};
