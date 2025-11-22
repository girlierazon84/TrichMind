// server/src/services/predictService.ts

import axios from "axios";
import { Predict, HealthLog } from "../models";
import { PredictDTO } from "../schemas";
import { ENV_AUTO } from "../config";
import { loggerService } from "./loggerService";

/**------------------------------------------------
 * Response shape expected from the FastAPI ML model
 * (FastAPI /predict_friendly → /predict)
 ---------------------------------------------------**/
interface PredictResponse {
    risk_score: number;
    risk_bucket: string;
    confidence: number;
    model_version?: string;
    risk_code?: string;
    runtime_sec?: number;
}

/**------------------------------------------------------------
 * Prediction Service
 * Handles interactions with the ML model for user predictions.
---------------------------------------------------------------**/
export const predictService = {
    async predict(userId: string, input: PredictDTO) {
        const endpoint = `${ENV_AUTO.ML_BASE_URL}/predict_friendly`;

        try {
            console.log(`📡 [PredictService] Sending payload to ${endpoint}`);
            console.log("📦 [PredictService] Payload:", input);

            const { data } = await axios.post<PredictResponse>(endpoint, input, {
                timeout: 15000,
                headers: { "Content-Type": "application/json" },
                // withCredentials is not needed here because this is
                // server → server, not browser → server
            });

            console.log("✅ [PredictService] ML Response:", data);

            const { risk_score, risk_bucket, confidence, model_version } = data;

            // 1️⃣ Store prediction document
            const prediction = await Predict.create({
                userId,
                ...input,
                risk_score,
                risk_bucket,
                confidence,
                model_version: model_version || "v1",
                served_by: "FastAPI",
            });

            // 2️⃣ Auto-log into HealthLog as a relapseRisk snapshot
            await HealthLog.create({
                userId,
                // These fields depend on your PredictDTO shape – using safe fallbacks
                sleepHours: (input as any).sleepHours ?? 0,
                stressLevel: (input as any).stressLevel ?? 0,
                exerciseMinutes: (input as any).exerciseMinutes ?? 0,
                date: new Date(),
                relapseRisk: {
                    score: risk_score,
                    bucket: (risk_bucket as any) ?? "unknown",
                    confidence: confidence ?? 0,
                },
            });

            await loggerService.logInfo(
                "Prediction created & HealthLog recorded",
                {
                    userId,
                    risk_score,
                    risk_bucket,
                    confidence,
                }
            );

            return prediction;
        } catch (err: any) {
            console.error("❌ [PredictService] ML request failed");
            console.error("   Message:", err.message);

            if (err.response) {
                console.error("   Status:", err.response.status);
                console.error("   Response data:", err.response.data);
            } else if (err.request) {
                console.error("   No response received from FastAPI service.");
            } else {
                console.error("   Unknown error:", err);
            }

            await loggerService.logError("Prediction failed", {
                userId,
                endpoint,
                error: err.message,
                status: err.response?.status,
            });

            throw new Error(
                err.response?.data?.detail ||
                err.message ||
                "Prediction service unavailable"
            );
        }
    },
};

export default predictService;
