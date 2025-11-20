// server/src/config/env.auto.ts

import dotenv from "dotenv";


// -------------------------------
// LOAD ENV VARIABLES
// -------------------------------
dotenv.config();

// -------------------------------
// ENV DETECTION HELPERS
// -------------------------------
const isDocker = () => {
    try {
        if (process.env.DOCKERIZED === "true") return true;
        if (process.env.CONTAINERIZED === "true") return true;
        if (process.env.HOSTNAME?.length && !process.env.HOSTNAME.includes("DESKTOP")) return true;
        return false;
    } catch {
        return false;
    }
};

// -------------------------------
// ENV DETECTION HELPERS
// -------------------------------
const isLocal = () =>
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "local" ||
    !isDocker();

// -------------------------------
// REQUIRED ENV VARS
// -------------------------------
const required = (key: string, fallback?: string): string => {
    const val = process.env[key] ?? fallback;
    if (!val) throw new Error(`❌ Missing ENV var: ${key}`);
    return val;
};

// -------------------------------
// AUTO SWITCH HOSTNAMES
// -------------------------------
const mongoHost = isLocal() ? "localhost:27018" : "mongo:27017";
const mlHost    = isLocal() ? "localhost:8000" : "ml:8000";

// -------------------------------
// EXPORT ENV VARS
// -------------------------------
export const ENV = {
    NODE_ENV: process.env.NODE_ENV || "development",
    IS_DOCKER: isDocker(),
    IS_LOCAL: isLocal(),

    PORT: Number(process.env.PORT) || 8080,

    MONGO_URI: required("MONGO_URI", `mongodb://${mongoHost}/trichmind`),

    ML_BASE_URL: required("ML_BASE_URL", `http://${mlHost}`),

    JWT_SECRET: required("JWT_SECRET", "local-secret"),
    JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "local-refresh"),

    CLIENT_URL: process.env.CLIENT_URL || (isLocal()
        ? "http://localhost:5173"
        : "http://client:5000"
    ),
};

// -------------------------------
// DEBUG ENV VARS
// -------------------------------
console.log("🌍 ENV MODE:", {
    NODE_ENV: ENV.NODE_ENV,
    IS_LOCAL: ENV.IS_LOCAL,
    IS_DOCKER: ENV.IS_DOCKER,
    MONGO_URI: ENV.MONGO_URI,
    ML_BASE_URL: ENV.ML_BASE_URL,
});
