// client/src/services/predictApi.ts

import { axiosClient } from "./axiosClient";
import { loggerApi } from "./loggerApi";
import type { PredictPayload, PredictionResponse } from "@/types/ml";

/**
 * 🔮 Predict API — communicates with ML backend
 * Now includes structured logging for observability.
 */
export const predictApi = {
    /** 🔮 Send payload for relapse risk prediction */
    predict: async (payload: PredictPayload): Promise<PredictionResponse> => {
        const start = performance.now();
        try {
            const res = await axiosClient.post<PredictionResponse>("/predict", payload);

            await loggerApi.log({
                category: "ml",
                level: "info",
                message: "Prediction request successful",
                context: {
                    duration_ms: Math.round(performance.now() - start),
                    payloadSummary: {
                        pulling_severity: payload.pulling_severity,
                        frequency: payload.pulling_frequency_encoded,
                        age: payload.age,
                    },
                },
            });

            return res.data;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);

            await loggerApi.error("Prediction request failed", {
                error: msg,
                payloadPreview: {
                    severity: payload.pulling_severity,
                    freq: payload.pulling_frequency_encoded,
                },
            });

            throw err;
        }
    },
};
