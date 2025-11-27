// server/src/services/mlClient.ts

import axios from "axios";
import { ENV_AUTO } from "../config";
import { logger } from "../utils";

/**--------------------------------------------------
    Features expected by your relapse-risk model.
    Mirrors your FE description:
        - age
        - age_of_onset
        - years_since_onset?
        - pulling_severity
        - pulling_frequency
        - pulling_awareness
        - successfully_stopped
        - how_long_stopped_days
        - emotion
-----------------------------------------------------*/
export interface RelapseFeatures {
    age: number;
    age_of_onset: number;
    years_since_onset?: number;

    pulling_severity: number;
    pulling_frequency: string;
    pulling_awareness: string;
    successfully_stopped: string | boolean;
    how_long_stopped_days: number;

    emotion: string;
}

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

// Path for relapse-risk predictions
const ML_RELAPSE_PATH =
    process.env.ML_RELAPSE_PATH || "/predict_friendly";

// Axios instance for ML service
const mlHttp = axios.create({
    baseURL: ML_BASE_URL,
    timeout: 6000,
});

/**-----------------------------------------------------------------------
    Send relapse-risk features to the ML service and get a prediction.
--------------------------------------------------------------------------*/
export async function predictRelapseRisk(
    features: RelapseFeatures
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
