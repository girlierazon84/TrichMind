import dotenv from "dotenv";
dotenv.config();

/** Require critical environment variables */
const required = (key: string, fallback?: string): string => {
    const value = process.env[key] ?? fallback;
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
};

export const ENV = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT || 8080),

    // Database
    MONGO_URI: required("MONGO_URI"),

    // Authentication
    JWT_SECRET: required("JWT_SECRET", "super-secret-change-me"),
    JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "refresh-secret-change-me"),

    // FastAPI ML integration
    ML_BASE_URL: process.env.ML_BASE_URL || "http://127.0.0.1:8000",

    // CORS / Frontend
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

    // Email (SMTP)
    SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: process.env.SMTP_PORT || "587",
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",

    // Logging & Artifacts
    LOG_DIR: process.env.LOG_DIR || "./logs",
    MODEL_ARTIFACT_PATH:
        process.env.MODEL_ARTIFACT_PATH ||
        "C:\\Users\\girli\\OneDrive\\Desktop\\Portfolio-Projects\\TrichMind\\ml\\artifacts\\training_outputs\\best_models",

    // ...
    RELAPSE_ALERT_THRESHOLD: Number(process.env.RELAPSE_ALERT_THRESHOLD || 0.7),

} as const;
