// server/src/config/mongo.ts - MongoDB connection configuration for TrichMind Backend

import mongoose from "mongoose";
import { ENV_AUTO } from "../config";
import { logger } from "../utils";

/**---------------------------------------
    Resolve DB name (defaults to trichmind_db)
------------------------------------------*/
const DB_NAME =
    (ENV_AUTO as any).MONGO_DB_NAME?.trim?.() ||
    process.env.DB_NAME ||
    "trichmind_db";

/**---------------------------------------
    Connect to MongoDB using Mongoose.
------------------------------------------*/
export const connectMongo = async (): Promise<void> => {
    try {
        logger.info(
            `[mongo] 🔌 Connecting to MongoDB at: ${ENV_AUTO.MONGO_URI} (db: ${DB_NAME})`
        );

        await mongoose.connect(ENV_AUTO.MONGO_URI, {
            dbName: DB_NAME,
        });

        logger.info("[mongo] ✅ Connected to MongoDB");
    } catch (err) {
        const message = (err as Error)?.message ?? String(err);
        logger.error(`[mongo] ❌ Connection failed: ${message}`);

        // ❗ IMPORTANT:
        // - In development: DO NOT crash the server.
        //   We still want /api/ping, /api/auth/* etc. to work.
        // - In production: you *may* want to fail fast.
        if (ENV_AUTO.NODE_ENV === "production") {
            process.exit(1);
        }

        // In development: just log the error and continue.
    }
};
