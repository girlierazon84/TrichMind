// server/src/config/env.auto.ts

import dotenv from "dotenv";


// --------------------------
// LOAD ENV VARIABLES
// --------------------------
dotenv.config();

// -------------------------------------------------------
// Detect real Docker environment reliably.
// This works even when NODE_ENV is set manually.
// -------------------------------------------------------
const isDocker = () => {
    try {
        // Docker sets this automatically
        if (process.env.DOCKERIZED === "true") return true;
        if (process.env.CONTAINERIZED === "true") return true;

        // Docker Desktop names containers by ID-like hostnames
        if (process.env.HOSTNAME && process.env.HOSTNAME.length > 12) return true;

        // Local machines typically don't have a cgroup mount for docker
        if (require("fs").existsSync("/.dockerenv")) return true;

        return false;
    } catch {
        return false;
    }
};

// --------------------------
// ENV HELPERS
// --------------------------
const isLocal = () => !isDocker();

// --------------------------
// Always safe accessor
// --------------------------
const required = (key: string, fallback?: string) => {
    const v = process.env[key] ?? fallback;
    if (!v) throw new Error(`Missing ENV var: ${key}`);
    return v;
};

// ----------------------------------
// AUTO SWITCH HOSTNAMES - MONGO
// ----------------------------------
const mongoHost = isLocal()
    ? "localhost:27018"       // LOCAL
    : "mongo:27017";          // DOCKER

// ---------------------------------
// AUTO SWITCH HOSTNAMES - ML
// ---------------------------------
const mlHost = isLocal()
    ? "localhost:8000"        // LOCAL
    : "ml:8000";              // DOCKER

// --------------------------
// EXPORT ENV
// --------------------------
export const ENV = {
    NODE_ENV: process.env.NODE_ENV || "development",
    IS_DOCKER: isDocker(),
    IS_LOCAL: isLocal(),

    // Server Port
    PORT: Number(process.env.PORT) || 8080,

    // ⬅ ALWAYS overwritten by auto-switch
    MONGO_URI: `mongodb://${mongoHost}/trichmind`,
    ML_BASE_URL: `http://${mlHost}`,

    // Auth
    JWT_SECRET: required("JWT_SECRET", "local-secret"),
    JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "local-refresh"),

    // Client URL
    CLIENT_URL: isLocal()
        ? "http://localhost:5173"
        : "http://client:5000",
};

// --------------------------
// DEBUG LOG
// --------------------------
console.log("🌍 ENV AUTO SWITCH:", {
    NODE_ENV: ENV.NODE_ENV,
    IS_LOCAL: ENV.IS_LOCAL,
    IS_DOCKER: ENV.IS_DOCKER,
    MONGO_URI: ENV.MONGO_URI,
    ML_BASE_URL: ENV.ML_BASE_URL,
});
