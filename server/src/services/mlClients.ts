// server/src/services/mlClient.ts

import axios from "axios";
import { ENV_AUTO } from "../config";
import { logger } from "../utils";
import type { RelapseFeaturesExtended } from "../types/relapseFeatures";


/**--------------------------------------------------------
    Shape returned by the FastAPI relapse-risk endpoint
    (matches FastAPI _run_predict_core output)
-----------------------------------------------------------*/
export interface MlRelapseResponse {
    risk_score: number;               // 0–1
    risk_bucket: "low" | "medium" | "high";
    confidence: number;               // 0–1
    model_version?: string;
    risk_code?: string;               // e.g. "low", "medium", "high" (for ML/rules mapping)
    runtime_sec?: number;             // server-side runtime
}

/**--------------------------------------------
    Base URL and path for the ML service.
    You can tweak via env:
        - ENV_AUTO.ML_BASE_URL
        - ML_BASE_URL
        - ML_RELAPSE_PATH
-----------------------------------------------*/
const ML_BASE_URL =
    ENV_AUTO.ML_BASE_URL ||
    process.env.ML_BASE_URL ||
    "http://localhost:8000";

// Path for relapse-risk predictions (overview card)
const ML_RELAPSE_PATH =
    process.env.ML_RELAPSE_PATH || "/predict_relapse_overview";

// Axios instance for ML service
const mlHttp = axios.create({
    baseURL: ML_BASE_URL,
    timeout: 10_000,
});

/**-----------------------------------------------------------------------
    Send relapse-risk features to the ML service and get a prediction.

    Uses the extended feature vector (profile + journal + health) that
    matches FastAPI's RelapseOverviewFeatures → PredictIn encoding.
--------------------------------------------------------------------------*/
export async function predictRelapseRisk(
    features: RelapseFeaturesExtended
): Promise<MlRelapseResponse> {
    // Send POST request to ML service
    try {
        // Log the outgoing request
        logger.info(
            `[ML] Sending relapse-overview payload to ${ML_BASE_URL}${ML_RELAPSE_PATH}`
        );

        // Send request
        const { data } = await mlHttp.post<MlRelapseResponse>(
            ML_RELAPSE_PATH,
            features
        );

        // Log the response
        logger.info(`[ML] Relapse-overview response: ${JSON.stringify(data)}`);
        return data;
    } catch (err: any) {
        // Log the error details
        const status = err?.response?.status;
        const msg = err?.message ?? String(err);

        // Log error
        logger.error(
            `❌ ML relapse-risk request failed (${ML_RELAPSE_PATH}) – status: ${
                status ?? "n/a"
            }, error: ${msg}`
        );

        // Log response data if available
        if (err?.response?.data) {
            // Detailed response data
            logger.error(
                `[ML] Response data: ${JSON.stringify(
                    err.response.data,
                    null,
                    2
                )}`
            );
        }

        throw err;
    }
}
