// client/src/types/ml.ts

// Risk bucket categories
export type RiskBucket = "low" | "medium" | "high";

// Payload sent to the ML model
export interface PredictPayload {
    age: number;
    age_of_onset: number;
    years_since_onset?: number;

    pulling_severity: number;
    pulling_frequency: string;     // NOT encoded
    pulling_awareness: string;     // NOT encoded
    successfully_stopped: string | boolean;
    how_long_stopped_days: number;

    emotion: string;
}

// Response from the ML model
export interface PredictionResponse {
    risk_score: number;
    confidence: number;
    risk_bucket: RiskBucket;
}
