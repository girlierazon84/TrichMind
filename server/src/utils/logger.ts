// server/src/utils/logger.ts

import fs from "fs";
import path from "path";
import util from "util";
import { ENV } from "../config";


/**-----------------------------------
    Logger (file + console) with:
    - daily rotation
    - sensitive key redaction
    - ENV-aware formatting
--------------------------------------*/

// Ensure log directory exists
const LOG_DIR = path.resolve(process.cwd(), ENV.LOG_DIR || "./logs");
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Keys to redact from logs (case-insensitive)
const REDACT_KEYS = new Set(
    [
        "password",
        "oldPassword",
        "newPassword",
        "currentPassword",
        "token",
        "accessToken",
        "refreshToken",
        "authorization",
        "cookie",
        "set-cookie",
        "smtp_pass",
        "SMTP_PASS",
    ].map((k) => k.toLowerCase())
);

// Deep redact function (handles circular refs)
function redactDeep(value: unknown, depth = 5, seen = new WeakSet<object>()): unknown {
    // Base cases
    if (depth <= 0) return value;

    // Handle arrays
    if (Array.isArray(value)) {
        return value.map((v) => redactDeep(v, depth - 1, seen));
    }

    // Handle objects
    if (value && typeof value === "object") {
        // circular protection
        if (seen.has(value)) return "[Circular]";
        seen.add(value);

        // redact keys
        const obj = value as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
            const key = k.toLowerCase();
            out[k] = REDACT_KEYS.has(key) ? "[REDACTED]" : redactDeep(v, depth - 1, seen);
        }
        return out;
    }

    return value;
}

// Get today's date stamp for log file naming (UTC)
function todayStamp(): string {
    return new Date().toISOString().split("T")[0];
}

// Get log file path for today
function getLogFile(): string {
    const date = todayStamp();
    return path.join(LOG_DIR, `trichmind-${date}.log`);
}

// Format message for logging
function formatMessage(message: unknown): string {
    if (typeof message === "string") return message;
    return util.inspect(message, { depth: 5, breakLength: 120 });
}

// Log levels
type LogLevel = "info" | "warn" | "error";

// Write log entry
function write(level: LogLevel, message: unknown, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const env = (ENV.NODE_ENV || "development").toUpperCase();

    // Redact sensitive info (message + meta)
    // Redact message
    const safeMsg =
        typeof message === "object" && message !== null ? redactDeep(message) : message;

    // Redact meta
    const safeMeta =
        meta && typeof meta === "object"
            ? (redactDeep(meta) as Record<string, unknown>)
            : undefined;

    // Format strings
    const msgStr = formatMessage(safeMsg);

    // Format meta if present
    const metaStr =
        safeMeta && Object.keys(safeMeta).length > 0
            ? ` | meta=${util.inspect(safeMeta, { depth: 5, breakLength: 120 })}`
            : "";

    // Final log line
    const line = `[${timestamp}] [${env}] [${level.toUpperCase()}] ${msgStr}${metaStr}\n`;

    // Console (color only if TTY)
    const isTTY = Boolean(process.stdout.isTTY);
    const colors: Record<string, string> = {
        info: "\x1b[36m",
        warn: "\x1b[33m",
        error: "\x1b[31m",
        reset: "\x1b[0m",
    };

    // Trim end for console output
    const out = line.trimEnd();
    if (level === "error") {
        // eslint-disable-next-line no-console
        console.error(isTTY ? colors.error + out + colors.reset : out);
    } else if (level === "warn") {
        // eslint-disable-next-line no-console
        console.warn(isTTY ? colors.warn + out + colors.reset : out);
    } else {
        // eslint-disable-next-line no-console
        console.log(isTTY ? colors.info + out + colors.reset : out);
    }

    // File append (daily rotated)
    try {
        fs.appendFileSync(getLogFile(), line, "utf8");
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            "❌ Failed to write log file:",
            (err as Error)?.message ?? String(err)
        );
    }
}

// Exported logger object (named + default-safe)
export const logger = {
    info: (msg: unknown, meta?: Record<string, unknown>) => write("info", msg, meta),
    warn: (msg: unknown, meta?: Record<string, unknown>) => write("warn", msg, meta),
    error: (msg: unknown, meta?: Record<string, unknown>) => write("error", msg, meta),
};

// Export LogLevel type
export type { LogLevel };

// Contextual logging helper
export const logWithContext = (
    level: LogLevel,
    context: string,
    message: unknown,
    meta?: Record<string, unknown>
) => {
    // Prepend context to message
    write(level, `[${context}] ${formatMessage(message)}`, meta);
};

export default logger;
