// server/src/services/mlClient.ts

import axios from "axios";

const ML_BASE_URL =
    process.env.ML_BASE_URL ||
    process.env.ML_API_URL ||
    "http://localhost:8000";

/**
 * Exact feature shape used by your relapse-risk predictor model.
 */
export interface RelapseFeatures {
    age: number;
    age_of_onset: number;
    years_since_onset?: number | null;

    pulling_severity: number;
    pulling_frequency: string;          // NOT encoded
    pulling_awareness: string;          // NOT encoded
    successfully_stopped: string | boolean;
    how_long_stopped_days: number;

    emotion: string;
}

export interface MlRelapseResponse {
    risk_bucket: "low" | "medium" | "high";
    risk_score: number;      // 0–1
    confidence: number;      // 0–1
    model_version?: string;
    risk_code?: string;      // include if your FastAPI sends it
}

const client = axios.create({
    baseURL: ML_BASE_URL,
    timeout: 6000,
});

/**
 * Call FastAPI relapse-risk endpoint.
 * 🔧 Change `/predict-relapse` to your real path if needed.
 */
export async function predictRelapseRisk(
    features: RelapseFeatures
): Promise<MlRelapseResponse> {
    const { data } = await client.post<MlRelapseResponse>(
        "/predict-relapse",
        features
    );
    return data;
}
