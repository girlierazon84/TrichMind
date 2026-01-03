// server/src/services/predictService.ts

import axios from "axios";
import { Predict, HealthLog } from "../models";
import type { PredictDTO } from "../schemas";
import { ENV_AUTO } from "../config";
import { loggerService } from "./loggerService";
import type {
    PredictRiskBucket,
    HealthRiskBucket
} from "../models";


// Response from ML service
interface PredictResponse {
    risk_score: number;
    risk_bucket: PredictRiskBucket | string;
    confidence: number;
    model_version?: string;
    risk_code?: string;
    runtime_sec?: number;
    debug?: unknown;
}

// Message when ML service is offline
const ML_OFFLINE_MESSAGE =
    "Our TrichMind ML coach is currently offline, but you can still use journaling, triggers and other tools 💚";

// Predict service
export const predictService = {
    // Make a prediction
    async predict(userId: string, input: PredictDTO) {
        // ML endpoint
        const endpoint = `${ENV_AUTO.ML_BASE_URL}/predict_friendly`;

        // Log start
        void loggerService.logInfo(
            "Prediction request started",
            { endpoint, emotion: input.emotion },
            "ml",
            userId
        );

        // Call ML service
        try {
            // 1) Request prediction
            const { data } = await axios.post<PredictResponse>(endpoint, input, {
                timeout: 15_000,
                headers: { "Content-Type": "application/json" },
            });

            // 2) Validate response
            if (typeof data?.risk_score !== "number") {
                throw new Error(ML_OFFLINE_MESSAGE);
            }

            // 3) Extract values
            const risk_bucket = (data.risk_bucket ?? "low") as PredictRiskBucket;
            const risk_score = data.risk_score;
            const confidence = typeof data.confidence === "number" ? data.confidence : null;

            // 1) Store prediction
            const prediction = await Predict.create({
                userId,
                kind: "friendly",
                ...input,
                risk_score,
                risk_bucket,
                confidence,
                model_version: data.model_version || "unknown",
                served_by: "FastAPI",
            });

            // 2) Snapshot into HealthLog
            const healthBucket: HealthRiskBucket =
                risk_bucket === "low" || risk_bucket === "medium" || risk_bucket === "high"
                    ? risk_bucket
                    : "unknown";

            // Store HealthLog entry
            await HealthLog.create({
                userId,
                sleepHours: (input as any).sleepHours ?? 0,
                stressLevel: (input as any).stressLevel ?? 0,
                exerciseMinutes: (input as any).exerciseMinutes ?? 0,
                date: new Date(),
                relapseRisk: {
                    score: risk_score,
                    bucket: healthBucket,
                    confidence: confidence ?? null,
                },
            });

            // Log success
            void loggerService.logInfo(
                "Prediction stored + HealthLog snapshot saved",
                { risk_score, risk_bucket, confidence },
                "ml",
                userId
            );

            // Return prediction
            return prediction;
        } catch (err: any) {
            // Log error
            void loggerService.logError(
                "Prediction failed",
                {
                    endpoint,
                    error: err?.message ?? String(err),
                    status: err?.response?.status,
                    responseData: err?.response?.data,
                },
                "ml",
                userId
            );

            // Rethrow error
            throw new Error(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Prediction service unavailable"
            );
        }
    },
};

export default predictService;
