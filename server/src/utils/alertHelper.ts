// server/src/utils/alertHelper.ts

import axios from "axios";
import { ENV, ENV_AUTO } from "../config";
import { logger } from "./logger";


/**---------------------------------------------------
Trigger relapse alert email through the Node backend.
Used by internal jobs or other services.
------------------------------------------------------**/
const resolveServerBaseUrl = (): string => {
    // 1) Prefer explicit SERVER_URL from ENV, if present
    const explicit = (ENV as any).SERVER_URL as string | undefined;
    if (explicit) {
        return explicit.replace(/\/$/, "");
    }

    // 2) Auto-switch based on environment
    if (ENV_AUTO.IS_LOCAL) {
        return `http://localhost:${ENV_AUTO.PORT}`;
    }

    // 3) In Docker network, "server" is the service name
    return `http://server:${ENV_AUTO.PORT}`;
};

export const triggerRelapseAlert = async (userId: string, score: number) => {
    try {
        const apiUrl = `${resolveServerBaseUrl()}/api/alerts/relapse`;

        await axios.post(
            apiUrl,
            { userId, score },
            { timeout: 10_000 }
        );

        logger.info(
            `📨 Relapse alert triggered for user ${userId} (score=${score.toFixed(2)})`
        );
    } catch (err: any) {
        logger.error(
            `❌ Failed to trigger relapse alert for ${userId}: ${err.message}`
        );
    }
};

export default triggerRelapseAlert;