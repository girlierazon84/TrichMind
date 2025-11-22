// server/src/utils/scheduler.ts

import cron from "node-cron";
import axios from "axios";
import { ENV, ENV_AUTO } from "../config";
import { logger } from "./logger";

/** Resolve the base URL for this Node server (local vs Docker). */
const resolveServerBaseUrl = (): string => {
    const explicit = (ENV as any).SERVER_URL as string | undefined;
    if (explicit) {
        return explicit.replace(/\/$/, "");
    }

    if (ENV_AUTO.IS_LOCAL) {
        return `http://localhost:${ENV_AUTO.PORT}`;
    }

    return `http://server:${ENV_AUTO.PORT}`;
};

/**----------------------------
Schedule weekly summary emails
Runs every Sunday at 09:00
-------------------------------**/
export const startWeeklySummaryScheduler = () => {
    try {
        cron.schedule("0 9 * * 0", async () => {
            const apiUrl = `${resolveServerBaseUrl()}/api/summary/weekly`;

            try {
                await axios.post(apiUrl, {}, { timeout: 15_000 });
                logger.info(
                    "🕒 Weekly summary job triggered successfully (Sunday 09:00)"
                );
            } catch (err: any) {
                logger.error(
                    `❌ Weekly summary scheduler failed: ${err.message}`
                );
            }
        });

        logger.info(
            "📅 Weekly summary scheduler initialized (runs every Sunday 09:00)"
        );
    } catch (err: any) {
        logger.error(
            `❌ Failed to initialize weekly scheduler: ${err.message}`
        );
    }
};
