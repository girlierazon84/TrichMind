// server/src/utils/alertHelper.ts
import axios from "axios";
import { ENV } from "../config/env";
import { logger } from "./logger";

/**
 * Trigger relapse alert email through the Node backend
 * Example: Used by FastAPI webhook or scheduled job
 */
export const triggerRelapseAlert = async (userId: string, score: number) => {
    try {
        const url = `${ENV.CLIENT_URL.replace(/\/$/, "")}/api/alerts/relapse`;
        await axios.post(url, { userId, score });
        logger.info(`📨 Relapse alert triggered for user ${userId} (score=${score.toFixed(2)})`);
    } catch (err: any) {
        logger.error(`❌ Failed to trigger relapse alert: ${err.message}`);
    }
};
