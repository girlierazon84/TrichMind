import mongoose from "mongoose";
import { ENV } from "./env";

export const connectMongo = async (): Promise<void> => {
    try {
        await mongoose.connect(ENV.MONGO_URI);
        console.log(`[mongo] ✅ Connected to MongoDB`);
    } catch (err) {
        console.error("[mongo] ❌ Connection failed:", err);
        process.exit(1);
    }
};
