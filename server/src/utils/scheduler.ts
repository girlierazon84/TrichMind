// server/src/utils/scheduler.ts
import cron from "node-cron";
import axios from "axios";
import { ENV } from "../config/env";
import { logger } from "./logger";

/**
 * Schedule weekly summary emails
 * Runs every Sunday at 09:00
 */
export const startWeeklySummaryScheduler = () => {
    try {
        cron.schedule("0 9 * * 0", async () => {
            const apiUrl = `${ENV.SERVER_URL.replace(/\/$/, "")}/api/summary/weekly`;

            try {
                await axios.post(apiUrl, {}, { timeout: 15000 });
                logger.info("🕒 Weekly summary job triggered successfully (Sunday 09:00)");
            } catch (err: any) {
                logger.error(`❌ Weekly summary scheduler failed: ${err.message}`);
            }
        });

        logger.info("📅 Weekly summary scheduler initialized (runs every Sunday 09:00)");
    } catch (err: any) {
        logger.error(`❌ Failed to initialize weekly scheduler: ${err.message}`);
    }
};
