// server/src/services/predictService.ts

import axios from "axios";
import { Predict } from "../models/Predict";
import { PredictDTO } from "../schemas/predictSchema";
import { ENV } from "../config/env";
import { loggerService } from "./loggerService";

export const predictService = {
    async predict(userId: string, input: PredictDTO) {
        try {
            const { data } = await axios.post(`${ENV.ML_BASE_URL}/predict`, input);
            const { risk_score, risk_bucket, confidence, model_version } = data;

            const prediction = await Predict.create({
                userId,
                ...input,
                risk_score,
                risk_bucket,
                confidence,
                model_version,
                served_by: "FastAPI",
            });

            await loggerService.logInfo("Prediction created", { userId, risk_score });
            return prediction;
        } catch (err: any) {
            await loggerService.logError("Prediction failed", { userId, error: err.message });
            throw new Error("Prediction service unavailable");
        }
    },
};
