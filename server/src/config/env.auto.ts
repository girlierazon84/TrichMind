// server/src/config/env.auto.ts

import dotenv from "dotenv";
import fs from "fs";


/**--------------------
    Load .env files
-----------------------*/
dotenv.config();

/**---------------------------
    Detect docker reliably
------------------------------*/
const isDocker = () => {
    // Only trust explicit flags or /.dockerenv
    if (process.env.DOCKERIZED === "true") return true;
    if (process.env.CONTAINERIZED === "true") return true;
    return fs.existsSync("/.dockerenv");
};

// Local is simply “not docker”
const isLocal = () => !isDocker();

// Detect Render environment
const runningOnRender = process.env.RENDER === "true" || !!process.env.RENDER;

/**------------------
    Safe accessor
---------------------*/
const required = (key: string, fallback?: string) => {
    const v = process.env[key] ?? fallback;
    if (!v) throw new Error(`Missing ENV var: ${key}`);
    return v;
};

/**----------------------------------------------------------------
    AUTO-SWITCH HOSTS - MONGO
    🔁 Local dev: localhost:27017 (default Mongo port)
    🔁 Docker:    mongo:27017 (service name in docker network)
-------------------------------------------------------------------*/
const mongoHost = isLocal() ? "localhost:27017" : "mongo:27017";

/**---------------------------
    AUTO-SWITCH HOSTS - ML
------------------------------*/
const mlHost = isLocal() ? "localhost:8000" : "ml:8000";

/**
 * ML_BASE_URL default:
 *  - Local:   http://localhost:8000 (or ml:8000 in docker)
 *  - Render:  "" (disabled) unless ML_BASE_URL is explicitly set
 */
const defaultMlBaseUrl = runningOnRender ? "" : `http://${mlHost}`;

/**------------------
    Client & CORS
---------------------*/
const resolvedClientUrl =
    process.env.CLIENT_URL ||
    (isLocal()
        ? "http://localhost:5050"
        : "http://localhost:5050"); // browser always sees localhost

// CORS origins
const rawCors = process.env.CORS_ORIGIN;
const defaultCorsOrigins = isLocal()
    ?   [
            "http://localhost:5050",
            "http://127.0.0.1:5050",
            "http://localhost:5173",
        ]
    :   [resolvedClientUrl];

// Parse CORS origins from env or use defaults
const corsOrigins = rawCors
    ?   rawCors
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
    :   defaultCorsOrigins;

/**---------------------
    EXPORT ENV_AUTO
------------------------*/
export const ENV = {
    NODE_ENV: process.env.NODE_ENV || "development",
    IS_DOCKER: isDocker(),
    IS_LOCAL: isLocal(),

    // Application Port
    PORT: Number(process.env.PORT) || 8080,

    // Database URI (env override → auto host)
    MONGO_URI: process.env.MONGO_URI || `mongodb://${mongoHost}/trichmind`,

    // ML Service Base URL (env override → auto host / disabled on Render)
    // Use ?? so that empty string ("") is respected when set by defaultMlBaseUrl
    ML_BASE_URL: process.env.ML_BASE_URL ?? defaultMlBaseUrl,

    // JWT Secrets
    JWT_SECRET: required("JWT_SECRET", "local-secret"),
    JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "local-refresh"),

    // Client URL (single “main” URL)
    CLIENT_URL: resolvedClientUrl,

    // CORS allowed origins (array)
    CORS_ORIGINS: corsOrigins,

    // Optional extras (for consistency with .env / .env.docker)
    SERVER_URL: process.env.SERVER_URL || "http://localhost:8080",
    LOG_DIR: process.env.LOG_DIR || "./logs",
    RELAPSE_ALERT_THRESHOLD:
        Number(process.env.RELAPSE_ALERT_THRESHOLD) || 0.7,
};

/**-------------------
    DEBUG ENV VARS
----------------------*/
console.log("🌍 ENV AUTO SWITCH:", {
    NODE_ENV: ENV.NODE_ENV,
    IS_LOCAL: ENV.IS_LOCAL,
    IS_DOCKER: ENV.IS_DOCKER,
    MONGO_URI: ENV.MONGO_URI,
    ML_BASE_URL: ENV.ML_BASE_URL,
    CLIENT_URL: ENV.CLIENT_URL,
    CORS_ORIGINS: ENV.CORS_ORIGINS,
});
