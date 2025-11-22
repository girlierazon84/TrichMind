// server/src/config/env.auto.ts

import dotenv from "dotenv";
import fs from "fs";


// ---------------------------------------------
// CONFIG: AUTO ENV
// ---------------------------------------------
dotenv.config();

// -------------------------------------
// Detect docker reliably
// -------------------------------------
const isDocker = () => {
    if (process.env.DOCKERIZED === "true") return true;
    if (process.env.CONTAINERIZED === "true") return true;
    if (process.env.HOSTNAME && process.env.HOSTNAME.length > 12) return true;
    return fs.existsSync("/.dockerenv");
};

// -------------------------------------
// ENV VARS
// -------------------------------------
const isLocal = () => !isDocker();

// -------------------------------------
// Safe accessor
// -------------------------------------
const required = (key: string, fallback?: string) => {
    const v = process.env[key] ?? fallback;
    if (!v) throw new Error(`Missing ENV var: ${key}`);
    return v;
};

// -------------------------------------
// AUTO-SWITCH HOSTS - MONGO
// -------------------------------------
const mongoHost = isLocal()
    ? "localhost:27018"
    : "mongo:27017";

// -------------------------------------
// AUTO-SWITCH HOSTS - ML
// -------------------------------------
const mlHost = isLocal()
    ? "localhost:8000"
    : "ml:8000";

// -------------------------------------
// EXPORT ENV
// -------------------------------------
export const ENV = {
    NODE_ENV: process.env.NODE_ENV || "development",
    IS_DOCKER: isDocker(),
    IS_LOCAL: isLocal(),

    // Application Port
    PORT: Number(process.env.PORT) || 8080,

    // Database URIs
    MONGO_URI: `mongodb://${mongoHost}/trichmind`,
    ML_BASE_URL: `http://${mlHost}`,

    // JWT Secrets
    JWT_SECRET: required("JWT_SECRET", "local-secret"),
    JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "local-refresh"),

    // Client URL
    CLIENT_URL: isLocal()
        ? "http://localhost:5050"
        : "http://client:5050",
};

// -------------------------------------
// DEBUG ENV VARS
// -------------------------------------
console.log("🌍 ENV AUTO SWITCH:", {
    NODE_ENV: ENV.NODE_ENV,
    IS_LOCAL: ENV.IS_LOCAL,
    IS_DOCKER: ENV.IS_DOCKER,
    MONGO_URI: ENV.MONGO_URI,
    ML_BASE_URL: ENV.ML_BASE_URL,
});
