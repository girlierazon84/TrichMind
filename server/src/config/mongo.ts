// server/src/config/mongo.ts - MongoDB connection configuration for TrichMind Backend

import mongoose from "mongoose";
import { ENV_AUTO } from "../config";
import { logger } from "../utils";

export const connectMongo = async (): Promise<void> => {
    try {
        await mongoose.connect(ENV_AUTO.MONGO_URI);
        logger.info("[mongo] ✅ Connected to MongoDB");
    } catch (err) {
        logger.error(`[mongo] ❌ Connection failed: ${(err as Error).message}`);
        process.exit(1);
    }
};
