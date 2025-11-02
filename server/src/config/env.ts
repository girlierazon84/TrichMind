// server/src/config/env.ts - Environment configuration for TrichMind Backend

import dotenv from "dotenv";
dotenv.config();

/**-------------------------------------------------------
Helper: Require critical environment variables
Throws descriptive errors if required values are missing.
----------------------------------------------------------**/
const required = (key: string, fallback?: string): string => {
    const value = process.env[key] ?? fallback;
    if (!value) throw new Error(`❌ Missing required environment variable: ${key}`);
    return value;
};

/**----------------------------------------------------------------
✅ Centralized environment configuration for the TrichMind backend
-------------------------------------------------------------------**/
export const ENV = {
    // -----------------------
    // Environment Variables
    // -----------------------
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT) || 8080,

    // --------------------
    // MongoDB Connection
    // --------------------
    MONGO_URI: required("MONGO_URI", "mongodb://127.0.0.1:27018/trichmind"),

    // ----------------------
    // JWT & Authentication
    // ----------------------
    JWT_SECRET: required("JWT_SECRET", "super-secret-change-me"),
    JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "refresh-secret-change-me"),

    // --------------------
    // FastAPI ML backend
    // --------------------
    ML_BASE_URL: process.env.ML_BASE_URL || "http://127.0.0.1:8000",

    // ------------------------------------------
    // Backend (self-reference) + Frontend URLs
    // ------------------------------------------
    SERVER_URL: process.env.SERVER_URL || "http://localhost:8080",

    // -----------------
    // Frontend / CORS
    // -----------------
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    CORS_ORIGIN:
        process.env.CORS_ORIGIN ||
        "http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.208:5173",

    // -----------------------------
    // SMTP (Email configuration)
    // -----------------------------
    SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",

    // -----------------------------
    // Logging / Model directories
    // -----------------------------
    LOG_DIR: process.env.LOG_DIR || "./logs",
    MODEL_ARTIFACT_PATH:
        process.env.MODEL_ARTIFACT_PATH ||
        "C:\\Users\\girli\\OneDrive\\Desktop\\Portfolio-Projects\\TrichMind\\ml\\artifacts\\training_outputs\\best_models",

    // ------------------------------
    // Behavioral Risk & Thresholds
    // ------------------------------
    RELAPSE_ALERT_THRESHOLD: Number(process.env.RELAPSE_ALERT_THRESHOLD) || 0.7,
} as const;

/**------------------------------------------
🔒 Type definitions for ENV keys and values
---------------------------------------------**/
export type EnvKeys = keyof typeof ENV;
export type EnvValues = (typeof ENV)[EnvKeys];
