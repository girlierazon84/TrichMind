// server/src/services/predictService.ts

import axios from "axios";
import { Predict, HealthLog } from "../models";
import { PredictDTO } from "../schemas";
import { ENV_AUTO } from "../config";
import { loggerService } from "./loggerService";


/**------------------------------------------------
Response shape expected from the FastAPI ML model
---------------------------------------------------**/
interface PredictResponse {
    risk_score: number;
    risk_bucket: string;
    confidence: number;
    model_version?: string;
}

/**----------------------------------------------------------
Prediction Service
Handles interactions with the ML model for user predictions.
-------------------------------------------------------------**/
export const predictService = {
    async predict(userId: string, input: PredictDTO) {
        // 🔁 Use the FRIENDLY endpoint on FastAPI
        const endpoint = `${ENV_AUTO.ML_BASE_URL}/predict_friendly`;

        try {
            console.log(`📡 [PredictService] Sending payload to ${endpoint}`);

            const { data } = await axios.post<PredictResponse>(endpoint, input, {
                timeout: 15000,
                headers: { "Content-Type": "application/json" },
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
                sleepHours: 7,
                stressLevel: 5,
                exerciseMinutes: 0,
                date: new Date(),
                relapseRisk: {
                    score: risk_score,
                    bucket: (risk_bucket as any) ?? "unknown",
                    confidence: confidence ?? 0,
                },
            });

            await loggerService.logInfo("Prediction created & HealthLog recorded", {
                userId,
                risk_score,
            });

            return prediction;
        } catch (err: any) {
            console.error("❌ [PredictService] ML request failed:");
            console.error("   Message:", err.message);

            if (err.response) {
                console.error("   Response data:", err.response.data);
                console.error("   Status:", err.response.status);
            } else if (err.request) {
                console.error("   No response received from FastAPI service.");
            }

            await loggerService.logError("Prediction failed", {
                userId,
                error: err.message,
                endpoint,
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
