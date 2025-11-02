// server/src/services/predictService.ts

import axios from "axios";
import { Predict } from "../models/PredictModel";
import { PredictDTO } from "../schemas/predictSchema";
import { ENV } from "../config/env";
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
        // Construct FastAPI endpoint URL
        const endpoint = `${ENV.ML_BASE_URL}/predict`;
        try {
            console.log(`📡 [PredictService] Sending payload to ${endpoint}`);

            // Send POST request to FastAPI ML model
            const { data } = await axios.post<PredictResponse>(endpoint, input, {
                timeout: 15000, // 15s timeout
                headers: { "Content-Type": "application/json" },
            });

            console.log("✅ [PredictService] ML Response:", data);

            // Destructure response data
            const { risk_score, risk_bucket, confidence, model_version } = data;

            // Store prediction in the database
            const prediction = await Predict.create({
                userId,
                ...input,
                risk_score,
                risk_bucket,
                confidence,
                model_version: model_version || "v1",
                served_by: "FastAPI",
            });

            // Log successful prediction
            await loggerService.logInfo("Prediction created", { userId, risk_score });
            return prediction;
        } catch (err: any) {
            console.error("❌ [PredictService] ML request failed:");
            console.error("   Message:", err.message);

            // Log error details
            if (err.response) {
                console.error("   Response data:", err.response.data);
                console.error("   Status:", err.response.status);
            } else if (err.request) {
                console.error("   No response received from FastAPI service.");
            }

            // Log error to logger service
            await loggerService.logError("Prediction failed", {
                userId,
                error: err.message,
                endpoint,
            });

            // Throw user-friendly error
            throw new Error(
                err.response?.data?.detail ||
                err.message ||
                "Prediction service unavailable"
            );
        }
    },
};
