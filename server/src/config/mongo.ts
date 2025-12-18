// server/src/config/mongo.ts

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
    Key updates:
    - disable buffering → no “silent hangs”
    - add timeouts → fail fast
------------------------------------------*/
export const connectMongo = async (): Promise<void> => {
    // Trim whitespace from URI
    const uri = ENV_AUTO.MONGO_URI?.trim?.();

    // ✅ Prevent Mongoose from queueing operations when disconnected
    mongoose.set("bufferCommands", false);

    // Validate URI
    if (!uri) {
        const msg = "[mongo] ❌ Missing MONGO_URI";
        logger.error(msg);
        throw new Error(msg);
    }

    // Attempt connection
    try {
        logger.info(
            `[mongo] 🔌 Connecting to MongoDB at: ${uri} (db: ${DB_NAME})`
        );

        // Optional connection event hooks (helpful for debugging)
        mongoose.connection.on("connected", () => {
            logger.info("[mongo] ✅ Connected");
        });
        mongoose.connection.on("disconnected", () => {
            logger.error("[mongo] ⚠️ Disconnected");
        });
        mongoose.connection.on("error", (e) => {
            logger.error(`[mongo] ❌ Connection error: ${String(e)}`);
        });

        // Connect with timeouts
        await mongoose.connect(uri, {
            dbName: DB_NAME,
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 8000,
            socketTimeoutMS: 15000,
        });

        // Success
        logger.info("[mongo] ✅ Connected to MongoDB");
    } catch (err) {
        // Log error
        const message = (err as Error)?.message ?? String(err);
        logger.error(`[mongo] ❌ Connection failed: ${message}`);

        // In production: fail fast
        if (ENV_AUTO.NODE_ENV === "production") {
            throw err;
        }

        // In dev: do NOT throw, but buffering is disabled so routes will fail fast (no 30s hangs)
    }
};
