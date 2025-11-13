// server/src/utils/alertHelper.ts

import axios from "axios";
import { ENV } from "../config";
import { logger } from "./logger";


/**---------------------------------------------------
Trigger relapse alert email through the Node backend.
Used by ML service or cron jobs.
------------------------------------------------------**/
export const triggerRelapseAlert = async (userId: string, score: number) => {
    try {
        const apiUrl =
            `${ENV.SERVER_URL?.replace(/\/$/, "") || "http://localhost:" + ENV.PORT}/api/alerts/relapse`;

        await axios.post(apiUrl, { userId, score }, { timeout: 10000 });
        logger.info(`📨 Relapse alert triggered for user ${userId} (score=${score.toFixed(2)})`);
    } catch (err: any) {
        logger.error(`❌ Failed to trigger relapse alert for ${userId}: ${err.message}`);
    }
};