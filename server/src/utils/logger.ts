import fs from "fs";
import path from "path";
import { ENV } from "../config/env";

const logDir = ENV.LOG_DIR;
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

export const log = (message: string) => {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${message}\n`;
    console.log(formatted.trim());
    fs.appendFileSync(path.join(logDir, "server.log"), formatted);
};
