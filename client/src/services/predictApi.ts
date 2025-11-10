// client/src/services/predictApi.ts
import { axiosClient } from "./axiosClient";

export interface PredictPayload {
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

export interface PredictionResponse {
    risk_score: number;
    confidence: number;
    risk_bucket: "LOW" | "MEDIUM" | "HIGH";
}

/** 🔮 Predict relapse risk — API layer */
export const predictApi = {
    predict: async (payload: PredictPayload): Promise<PredictionResponse> => {
        const res = await axiosClient.post<PredictionResponse>("/ml/predict", payload);
        return res.data;
    },
};
