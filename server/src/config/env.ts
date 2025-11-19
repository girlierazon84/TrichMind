// server/src/config/env.ts

import dotenv from "dotenv";
dotenv.config();


/* -------------------------------------------------------
    Helper: Required environment variable with fallback
---------------------------------------------------------- */
const required = (key: string, fallback?: string): string => {
    const value = process.env[key] ?? fallback;
    if (!value) throw new Error(`❌ Missing required environment variable: ${key}`);
    return value;
};

/* ------------------------------------------------------------------
    🌍 ENV Mode Detection
    - Local dev  → Node runs outside Docker
    - Docker     → Node & Mongo run inside docker-compose
--------------------------------------------------------------------- */
const isLocal =
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "local" ||
    !process.env.NODE_ENV;

/* ------------------------------------------------------------------
    Dynamic Host Switching
--------------------------------------------------------------------- */
const DEFAULT_MONGO_HOST = isLocal ? "localhost:27018" : "mongo:27017";
const DEFAULT_ML_HOST    = isLocal ? "localhost:8000" : "ml:8000";
const DEFAULT_SERVER_HOST = isLocal ? "localhost:8080" : "server:8080";

/* ------------------------------------------------------------------
    ENV Export
--------------------------------------------------------------------- */
export const ENV = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT) || 8080,

    /* ---------------------------------------------------
        🍃 MongoDB — Auto-switch between local ↔ docker
    ------------------------------------------------------ */
    MONGO_URI: required(
        "MONGO_URI",
        `mongodb://${DEFAULT_MONGO_HOST}/trichmind`
    ),

    /* ---------------------------------------------------
        🔐 Auth / JWT
    ------------------------------------------------------ */
    JWT_SECRET: required("JWT_SECRET", "super-secret-change-me"),
    JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "refresh-secret-change-me"),

    /* ---------------------------------------------------
        🤖 FastAPI ML Backend (auto-switch)
    ------------------------------------------------------ */
    ML_BASE_URL: process.env.ML_BASE_URL || `http://${DEFAULT_ML_HOST}`,

    /* ---------------------------------------------------
        🌐 Server & CORS
    ------------------------------------------------------ */
    SERVER_URL: process.env.SERVER_URL || `http://${DEFAULT_SERVER_HOST}`,

    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

    CORS_ORIGIN:
        process.env.CORS_ORIGIN ||
        "http://localhost:5173,http://127.0.0.1:5173",

    /* ---------------------------------------------------
        📧 SMTP
    ------------------------------------------------------ */
    SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",

    /* ---------------------------------------------------
        📊 Logging & Model Artifacts
    ------------------------------------------------------ */
    LOG_DIR: process.env.LOG_DIR || "./logs",

    MODEL_ARTIFACT_PATH:
        process.env.MODEL_ARTIFACT_PATH ||
        "C:\\Users\\girli\\OneDrive\\Desktop\\Portfolio-Projects\\TrichMind\\ml\\artifacts\\training_outputs\\best_models",

    /* ---------------------------------------------------
        🔥 Risk Threshold
    ------------------------------------------------------ */
    RELAPSE_ALERT_THRESHOLD: Number(process.env.RELAPSE_ALERT_THRESHOLD) || 0.7,
} as const;

export type EnvKeys = keyof typeof ENV;
export type EnvValues = (typeof ENV)[EnvKeys];
