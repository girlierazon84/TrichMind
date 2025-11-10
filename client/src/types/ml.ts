// client/src/types/ml.ts

export type RiskBucket = "low" | "medium" | "high";

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
    risk_bucket: RiskBucket;
}
