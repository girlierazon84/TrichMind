// server/src/utils/scheduler.ts

import cron from "node-cron";
import axios from "axios";
import { ENV } from "../config";
import { logger } from "./logger";

/**------------------------------------------------
    Resolve this server base URL.
        - Prefers ENV.SERVER_URL
        - Falls back local/docker safe defaults
---------------------------------------------------*/
const resolveServerBaseUrl = (): string => {
  if (ENV.SERVER_URL) return ENV.SERVER_URL.replace(/\/$/, "");
  if (ENV.IS_DOCKER) return `http://server:${ENV.PORT}`;
  return `http://localhost:${ENV.PORT}`;
};

/**----------------------------------------------------------------
Schedule weekly summary emails — Runs every Sunday at 09:00
-------------------------------------------------------------------**/
export const startWeeklySummaryScheduler = () => {
  try {
    cron.schedule("0 9 * * 0", async () => {
      const apiUrl = `${resolveServerBaseUrl()}/api/summary/weekly`;

      try {
        await axios.post(apiUrl, {}, { timeout: 15_000 });
        logger.info("🕒 Weekly summary job triggered (Sun 09:00)", { apiUrl });
      } catch (err) {
        logger.error("❌ Weekly summary scheduler failed", {
          apiUrl,
          error: (err as Error)?.message ?? String(err),
        });
      }
    });

    logger.info("📅 Weekly summary scheduler initialized (Sun 09:00)");
  } catch (err) {
    logger.error("❌ Failed to initialize weekly scheduler", {
      error: (err as Error)?.message ?? String(err),
    });
  }
};

export default startWeeklySummaryScheduler;
