// client/src/api/mlApi.ts
import { axiosClient } from "./axiosClient";

export interface MLPayload {
    pulling_severity: number;
    pulling_frequency_encoded: number;
    awareness_level_encoded: number;
    how_long_stopped_days_est: number;
    successfully_stopped_encoded: number;
    years_since_onset: number;
    age: number;
    age_of_onset: number;
    emotion: string;
}

export interface MLPredictionResponse {
    risk_score: number;
    confidence: number;
    risk_bucket: "LOW" | "MEDIUM" | "HIGH";
}

export const mlApi = {
    /** 🔮 Predict relapse risk */
    predict: async (payload: MLPayload): Promise<MLPredictionResponse> => {
        const res = await axiosClient.post("/ml/predict", payload);
        return res.data;
    },
};
