import mongoose from "mongoose";
import { ENV } from "./env";
import { logger } from "../utils/logger";

export const connectMongo = async (): Promise<void> => {
    try {
        await mongoose.connect(ENV.MONGO_URI);
        logger.info("[mongo] ✅ Connected to MongoDB");
    } catch (err) {
        logger.error(`[mongo] ❌ Connection failed: ${(err as Error).message}`);
        process.exit(1);
    }
};
