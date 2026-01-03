// server/src/config/mongo.ts

import mongoose from "mongoose";
import { ENV } from "./env";
import { logger } from "../utils";

/**-------------------------------------------
    Ensure we only register listeners once
----------------------------------------------*/
let listenersAttached = false;

// Connect to MongoDB
export const connectMongo = async (): Promise<void> => {
    const uri = ENV.MONGO_URI;

    // Prevent Mongoose from queueing operations when disconnected
    mongoose.set("bufferCommands", false);

    // Validate MONGO_URI
    if (!uri) {
        const msg = "[mongo] ❌ Missing MONGO_URI";
        logger.error(msg);
        throw new Error(msg);
    }

    // Attempt connection
    try {
        logger.info(`[mongo] 🔌 Connecting (db: ${ENV.DB_NAME})`, {
            uri: uri.replace(/\/\/.*@/, "//[REDACTED]@"),
            isDocker: ENV.IS_DOCKER,
            nodeEnv: ENV.NODE_ENV,
        });

        // Attach listeners only once
        if (!listenersAttached) {
            listenersAttached = true;

            // Connection event listeners
            mongoose.connection.on("connected", () => logger.info("[mongo] ✅ Connected"));
            mongoose.connection.on("disconnected", () => logger.warn("[mongo] ⚠️ Disconnected"));
            mongoose.connection.on("error", (e) =>
                logger.error("[mongo] ❌ Connection error", { error: String(e) })
            );
        }

        // Connect with timeouts
        await mongoose.connect(uri, {
            dbName: ENV.DB_NAME,
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 8000,
            socketTimeoutMS: 15000,
        });

        // Successful connection
        logger.info("[mongo] ✅ Connected to MongoDB");
    } catch (err) {
        // Mesage extraction
        const message = (err as Error)?.message ?? String(err);
        logger.error("[mongo] ❌ Connection failed", { error: message });

        // Fail fast in prod / render; in local dev you may choose not to crash.
        if (!ENV.IS_LOCAL) throw err;
    }
};
