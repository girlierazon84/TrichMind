// server/src/utils/logger.ts
import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "server.log");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Write log message to console and file with timestamp + level.
 */
function write(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    // Console
    if (level === "error") console.error(formatted.trim());
    else if (level === "warn") console.warn(formatted.trim());
    else console.log(formatted.trim());

    // File
    fs.appendFileSync(LOG_FILE, formatted, "utf8");
}

export const logger = {
    info: (msg: string) => write("info", msg),
    warn: (msg: string) => write("warn", msg),
    error: (msg: string) => write("error", msg),
};
