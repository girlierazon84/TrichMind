// server/src/services/mlClient.ts

import axios from "axios";
import { ENV_AUTO } from "../config";
import { logger } from "../utils";
import type { RelapseFeaturesExtended } from "../types/relapseFeatures";


/**--------------------------------------------------------
    Shape returned by the FastAPI relapse-risk endpoint
-----------------------------------------------------------*/
export interface MlRelapseResponse {
    risk_score: number;               // 0–1
    risk_bucket: "low" | "medium" | "high";
    confidence: number;               // 0–1
    model_version?: string;
}

/**--------------------------------------------
    Base URL and path for the ML service.
    You can tweak via env:
        - ML_BASE_URL (otherwise fallbacks)
        - ML_RELAPSE_PATH if needed
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
    timeout: 6000,
});

/**-----------------------------------------------------------------------
    Send relapse-risk features to the ML service and get a prediction.
    Uses the extended feature vector (profile + journal + health).
--------------------------------------------------------------------------*/
export async function predictRelapseRisk(
    features: RelapseFeaturesExtended
): Promise<MlRelapseResponse> {
    try {
        const { data } = await mlHttp.post<MlRelapseResponse>(
            ML_RELAPSE_PATH,
            features
        );
        return data;
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        logger.error(`❌ ML relapse-risk request failed: ${msg}`);
        throw err;
    }
}
