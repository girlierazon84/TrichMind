// server/src/services/mlClient.ts

import axios from "axios";
import { ENV_AUTO } from "../config";
import { loggerService } from "./loggerService";
import type { RelapseFeaturesExtended } from "../types/relapseFeatures";


// Response from the ML relapse overview prediction endpoint
export interface MlRelapseResponse {
    risk_score: number; // 0–1
    risk_bucket: "low" | "medium" | "high";
    confidence: number; // 0–1
    model_version?: string;
    risk_code?: string;
    runtime_sec?: number;
}

// Base URL for the ML service
const ML_BASE_URL =
    ENV_AUTO.ML_BASE_URL || process.env.ML_BASE_URL || "http://localhost:8000";

// Path for the relapse overview prediction endpoint
const ML_RELAPSE_PATH =
    process.env.ML_RELAPSE_PATH || "/predict_relapse_overview";

// Axios instance for ML service communication
const mlHttp = axios.create({
    baseURL: ML_BASE_URL,
    timeout: 10_000,
});

// Function to predict relapse overview risk using the ML service
export async function predictRelapseOverviewRisk(
    // Input features for the prediction
    features: RelapseFeaturesExtended
): Promise<MlRelapseResponse> {
    // Log the request being sent to the ML service
    try {
        // Log the outgoing request
        void loggerService.logML("Sending relapse-overview payload to ML", {
            url: `${ML_BASE_URL}${ML_RELAPSE_PATH}`,
        });

        // Make the POST request to the ML service
        const { data } = await mlHttp.post<MlRelapseResponse>(ML_RELAPSE_PATH, features);

        // Log the received response
        void loggerService.logML("Received relapse-overview response", {
            risk_bucket: data?.risk_bucket,
            risk_score: data?.risk_score,
            model_version: data?.model_version,
        });

        // Return the prediction data
        return data;
    } catch (err: any) {
        // Extract status and message for logging
        const status = err?.response?.status;
        const msg = err?.message ?? String(err);

        // Log the error details
        void loggerService.logError(
            "ML relapse-overview request failed",
            {
                path: ML_RELAPSE_PATH,
                status: status ?? "n/a",
                error: msg,
                responseData: err?.response?.data,
            },
            "ml"
        );

        throw err;
    }
}
