// client/src/services/predictApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";
import type { PredictPayload, PredictionResponse } from "@/types/ml";

/**
 * 🔮 Predict API — communicates with ML backend
 * Fully integrated with centralized withLogging utility.
 */

// ──────────────────────────────
// Raw API function
// ──────────────────────────────
async function rawPredict(payload: PredictPayload): Promise<PredictionResponse> {
    // Backend route: POST /api/ml/predict
    const res = await axiosClient.post<PredictionResponse>("/api/ml/predict", payload);
    return res.data;
}

// ──────────────────────────────────────────────
// Wrapped API (with automatic logging + toasts)
// ──────────────────────────────────────────────
export const predictApi = {
    predict: withLogging(rawPredict, {
        category: "ml",
        action: "predict",
        showToast: true,
        successMessage: "Prediction completed successfully!",
        errorMessage: "Prediction request failed. Please try again.",
    }),
};

export default predictApi;
