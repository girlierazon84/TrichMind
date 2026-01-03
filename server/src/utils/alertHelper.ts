// server/src/utils/alertHelper.ts

import axios from "axios";
import { ENV } from "../config";
import { logger } from "./logger";

/**-----------------------------------------------------------
    Trigger relapse alert email through this Node backend.
    Used by internal jobs or other services.
--------------------------------------------------------------**/
// Resolve the server base URL based on environment
const resolveServerBaseUrl = (): string => {
    // 1) Prefer explicit SERVER_URL from ENV
    if (ENV.SERVER_URL) return ENV.SERVER_URL.replace(/\/$/, "");

    // 2) Fall back by environment
    if (ENV.IS_DOCKER) return `http://server:${ENV.PORT}`;
    return `http://localhost:${ENV.PORT}`;
};

// Trigger relapse alert
export const triggerRelapseAlert = async (userId: string, score: number) => {
    try {
        // Construct API URL
        const apiUrl = `${resolveServerBaseUrl()}/api/alerts/relapse`;

        // Send POST request to trigger alert
        await axios.post(apiUrl, { userId, score }, { timeout: 10_000 });

        // Log success
        logger.info("📨 Relapse alert triggered", {
            userId,
            score: Number(score.toFixed(3)),
            apiUrl,
        });
    } catch (err) {
        // Log failure
        logger.error("❌ Failed to trigger relapse alert", {
            userId,
            score: Number(score.toFixed(3)),
            error: (err as Error)?.message ?? String(err),
        });
    }
};

export default triggerRelapseAlert;
