// server/src/utils/logger.ts

import fs from "fs";
import path from "path";
import util from "util";
import { ENV } from "../config/env";

// Determine log directory dynamically from ENV
const LOG_DIR = path.resolve(process.cwd(), ENV.LOG_DIR || "./logs");

// Create logs directory if it doesn’t exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Daily log file rotation
const date = new Date().toISOString().split("T")[0];
const LOG_FILE = path.join(LOG_DIR, `trichmind-${date}.log`);

/**
 * Formats and writes log messages with timestamps, environment, and levels.
 */
function write(level: "info" | "warn" | "error", message: unknown): void {
    const timestamp = new Date().toISOString();
    const env = ENV.NODE_ENV.toUpperCase();
    const formattedMessage =
        typeof message === "string" ? message : util.inspect(message, { depth: 3 });
    const formatted = `[${timestamp}] [${env}] [${level.toUpperCase()}] ${formattedMessage}\n`;

    // --- Console output (with colors) ---
    const colors: Record<string, string> = {
        info: "\x1b[36m", // cyan
        warn: "\x1b[33m", // yellow
        error: "\x1b[31m", // red
        reset: "\x1b[0m",
    };

    if (level === "error") console.error(colors.error + formatted.trim() + colors.reset);
    else if (level === "warn") console.warn(colors.warn + formatted.trim() + colors.reset);
    else console.log(colors.info + formatted.trim() + colors.reset);

    // --- File logging ---
    try {
        fs.appendFileSync(LOG_FILE, formatted, "utf8");
    } catch (err) {
        console.error("❌ Failed to write log file:", (err as Error).message);
    }
}

/**
 * 🧠 Smart logger with info, warn, error + object-safe formatting
 */
export const logger = {
    info: (msg: unknown) => write("info", msg),
    warn: (msg: unknown) => write("warn", msg),
    error: (msg: unknown) => write("error", msg),
};

/** Optional utility for structured log contexts */
export const logWithContext = (
    level: "info" | "warn" | "error",
    context: string,
    message: unknown
) => {
    write(level, `[${context}] ${message}`);
};
