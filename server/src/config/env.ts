// server/src/config/env.ts

import dotenv from "dotenv";
import fs from "fs";
import path from "path";

/**---------------------------------------------------------------------------
    Load .env files (priority):
        1) .env.local
        2) .env
    NOTE: run from /server root (process.cwd()) or set DOTENV_CONFIG_PATH.
------------------------------------------------------------------------------*/

// Load .env.local first (highest priority)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
// Then load .env (fallback)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**-------------------------
    Environment helpers
----------------------------*/
const isDocker = (): boolean => {
    if (process.env.DOCKERIZED === "true") return true;
    if (process.env.CONTAINERIZED === "true") return true;
    return fs.existsSync("/.dockerenv");
};

// Environment flags
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_RENDER = process.env.RENDER === "true" || !!process.env.RENDER;
const IS_DOCKER = isDocker();
const IS_LOCAL = !IS_DOCKER && !IS_RENDER;

// Helper to get required env vars
const required = (key: string, fallback?: string): string => {
    // Check env var or use fallback
    const v = process.env[key] ?? fallback;
    // Throw error if missing
    if (!v) throw new Error(`❌ Missing required environment variable: ${key}`);
    return v;
};

// Helper to parse numbers with fallback
const toNumber = (v: string | undefined, fallback: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

// Helper to parse CSV strings into string arrays
const parseCsv = (v: string | undefined): string[] =>
    (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

// Helper to get unique strings from an array
const unique = (arr: string[]) => Array.from(new Set(arr));

/**-------------------------
    Auto-switch defaults
----------------------------*/
// Default DB hosts
const DEFAULT_MONGO_HOST = IS_LOCAL ? "localhost:27017" : "mongo:27017";
const DEFAULT_ML_HOST = IS_LOCAL ? "localhost:8000" : "ml:8000";

// Default MongoDB URI
const defaultMongoUri = `mongodb://${DEFAULT_MONGO_HOST}/trichmind`;
const defaultMlBaseUrl = IS_RENDER ? "" : `http://${DEFAULT_ML_HOST}`;

/**----------------------
    Client URL + CORS
-------------------------*/
const vercelClientFromEnv =
    process.env.VERCEL_CLIENT_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    undefined;

// Known production client URLs
const knownProdClients = unique(
    ["https://trichmind.vercel.app", vercelClientFromEnv].filter(Boolean) as string[]
);

// ✅ Default local is now Next.js :3000
const CLIENT_URL =
    process.env.CLIENT_URL ||
    (IS_LOCAL ? "http://localhost:3000" : knownProdClients[0] || "http://localhost:3000");

// Default local CORS allowlist
const defaultCorsLocal = unique([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5050",
    "http://127.0.0.1:5050",
]);

// Default prod allowlist
const defaultCorsProd = unique([CLIENT_URL, ...knownProdClients]);

/**--------------------------------------------------------------
    ✅ Backwards compatible CORS env:
    Preferred: CORS_ORIGINS="a,b,c"
        - Legacy:   CORS_ORIGIN="a,b,c" (kept for older code)
-----------------------------------------------------------------*/

// Parse CORS origins from env vars
const corsFromEnv =
    parseCsv(process.env.CORS_ORIGINS).length > 0
        ? parseCsv(process.env.CORS_ORIGINS)
        : parseCsv(process.env.CORS_ORIGIN);

// Final CORS origins
const CORS_ORIGINS =
    corsFromEnv.length > 0
        ? unique(corsFromEnv)
        : IS_LOCAL
            ? defaultCorsLocal
            : defaultCorsProd;

/**---------------
    Server URL
------------------*/
// Server port
const PORT = toNumber(process.env.PORT, 8080);

// Server base URL
const SERVER_URL =
    process.env.SERVER_URL?.trim() ||
    (IS_LOCAL ? `http://localhost:${PORT}` : `http://server:${PORT}`);

/**---------------
    Export ENV
------------------*/
export const ENV = {
    NODE_ENV,
    IS_DOCKER,
    IS_LOCAL,
    IS_RENDER,

    // Server
    PORT,

    // Database
    DB_NAME: (process.env.MONGO_DB_NAME || process.env.DB_NAME || "trichmind_db").trim(),
    MONGO_URI: (process.env.MONGO_URI || defaultMongoUri).trim(),

    // Auth / JWT
    JWT_SECRET: required("JWT_SECRET", IS_LOCAL ? "local-secret" : undefined),
    JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", IS_LOCAL ? "local-refresh-secret" : undefined),

    // ML
    ML_BASE_URL: process.env.ML_BASE_URL ?? defaultMlBaseUrl,

    // Server base URL
    SERVER_URL,

    // Client + CORS
    CLIENT_URL,
    CORS_ORIGINS,

    // Email (optional)
    SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: toNumber(process.env.SMTP_PORT, 587),
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",

    // TrichBot / OpenAI (optional)
    TRICHBOT_ENABLED: (process.env.TRICHBOT_ENABLED || "false").toLowerCase() === "true",
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4.1-mini",

    // App settings
    LOG_DIR: process.env.LOG_DIR || "./logs",
    RELAPSE_ALERT_THRESHOLD: toNumber(process.env.RELAPSE_ALERT_THRESHOLD, 0.7),
} as const;

export type EnvKeys = keyof typeof ENV;
export type EnvValues = (typeof ENV)[EnvKeys];
