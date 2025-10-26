import cron from "node-cron";
import axios from "axios";
import { ENV } from "../config/env";
import { logger } from "./logger";

/**
 * Schedule weekly summary emails
 */
export const startWeeklySummaryScheduler = () => {
    cron.schedule("0 9 * * 0", async () => {
        try {
            const url = `${ENV.CLIENT_URL.replace(/\/$/, "")}/api/summary/weekly`;
            await axios.post(url);
            logger.info("🕒 Weekly summary triggered (Sunday 09:00)");
        } catch (err: any) {
            logger.error(`❌ Weekly summary scheduler failed: ${err.message}`);
        }
    });

    logger.info("📅 Weekly summary scheduler started (runs every Sunday 09:00)");
};
