// server/src/services/predictService.ts

import axios from "axios";
import { Predict, HealthLog } from "../models";
import { PredictDTO } from "../schemas";
import { ENV_AUTO } from "../config";
import { loggerService } from "./loggerService";


/**--------------------------------------------------------------
    Response shape expected from the FastAPI ML model
    (FastAPI /predict_friendly and /predict_relapse_overview)
-----------------------------------------------------------------*/
interface PredictResponse {
    risk_score: number;
    risk_bucket: string;
    confidence: number;
    model_version?: string;
    risk_code?: string;
    runtime_sec?: number;
    debug?: unknown;
}

const ML_OFFLINE_MESSAGE =
    "Our TrichMind ML coach is currently offline, but you can still use journaling, triggers and other tools 💚";

/**-------------------------------------------------------------------
    Prediction Service
    Handles interactions with the ML model for user predictions.
    (This is the "manual" prediction flow, not the overview card.)
----------------------------------------------------------------------*/
export const predictService = {
    // Send user input to the ML model and handle the response
    async predict(userId: string, input: PredictDTO) {
        const endpoint = `${ENV_AUTO.ML_BASE_URL}/predict_friendly`;

        try {
            console.log(`📡 [PredictService] Sending payload to ${endpoint}`);
            console.log("📦 [PredictService] Payload:", input);

            const { data } = await axios.post<PredictResponse | any>(
                endpoint,
                input,
                {
                    timeout: 15_000,
                    headers: { "Content-Type": "application/json" },
                }
            );

            // Handle "wrapped" error case, just in case
            if (data && typeof data === "object" && data.ok === false) {
                const msg =
                    data.message ||
                    data.error ||
                    ML_OFFLINE_MESSAGE;

                await loggerService.logError("Prediction failed (wrapped)", {
                    userId,
                    endpoint,
                    backendPayload: data,
                    message: msg,
                });

                throw new Error(msg);
            }

            const {
                risk_score,
                risk_bucket,
                confidence,
                model_version,
            } = data as PredictResponse;

            if (
                typeof risk_score !== "number" ||
                typeof risk_bucket !== "string"
            ) {
                // Defensive: FastAPI should always send these, but if not,
                // treat as ML offline.
                const msg = ML_OFFLINE_MESSAGE;

                await loggerService.logError(
                    "Prediction payload missing required fields",
                    {
                        userId,
                        endpoint,
                        backendPayload: data,
                    }
                );

                throw new Error(msg);
            }

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

            // Log success
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
                console.error(
                    "   No response received from FastAPI service."
                );
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
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    err.message ||
                    "Prediction service unavailable"
            );
        }
    },
};

export default predictService;
