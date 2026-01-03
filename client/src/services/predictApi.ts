// client/src/services/predictApi.ts
"use client";

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";
import type {
    PredictPayload,
    PredictionResponse
} from "@/types/ml";


/**----------------------------------------------------------------
    POST /api/ml/predict_friendly
    axiosClient baseURL already ends with /api -> use "/ml/..."
-------------------------------------------------------------------*/
export async function rawPredict(payload: PredictPayload): Promise<PredictionResponse> {
    // Make POST request to the prediction endpoint
    const res = await axiosClient.post<PredictionResponse>("/ml/predict_friendly", payload);
    return res.data;
}

// Wrap the rawPredict function with logging functionality
export const predictApi = {
    // Log ML prediction calls
    predict: withLogging(rawPredict, { category: "ml", action: "ml_predict_friendly" }),
};

export default predictApi;
