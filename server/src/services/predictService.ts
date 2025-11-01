// server/src/services/predictService.ts

import axios from "axios";
import { Predict } from "../models/Predict";
import { PredictDTO } from "../schemas/predictSchema";
import { ENV } from "../config/env";
import { loggerService } from "./loggerService";

export const predictService = {
    async predict(userId: string, input: PredictDTO) {
        const endpoint = `${ENV.ML_BASE_URL}/predict`;
        try {
            console.log(`📡 [PredictService] Sending payload to ${endpoint}`);

            const { data } = await axios.post(endpoint, input, {
                timeout: 15000, // 15s timeout
                headers: { "Content-Type": "application/json" },
            });

            console.log("✅ [PredictService] ML Response:", data);

            const { risk_score, risk_bucket, confidence, model_version } = data;

            const prediction = await Predict.create({
                userId,
                ...input,
                risk_score,
                risk_bucket,
                confidence,
                model_version: model_version || "v1",
                served_by: "FastAPI",
            });

            await loggerService.logInfo("Prediction created", { userId, risk_score });
            return prediction;
        } catch (err: any) {
            // 🔥 Log actual error details
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

            // Forward the actual error message for easier debugging
            throw new Error(
                err.response?.data?.detail ||
                err.message ||
                "Prediction service unavailable"
            );
        }
    },
};
