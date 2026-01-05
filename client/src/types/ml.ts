// client/src/types/ml.ts

// Risk bucket categories (align with backend + ML)
export type RiskBucket = "low" | "medium" | "high";

// Payload sent to the ML model (your current predict_friendly shape)
export interface PredictPayload {
    age: number;
    age_of_onset: number;
    years_since_onset?: number;

    pulling_severity: number;

    // kept as strings because your API says “NOT encoded”
    pulling_frequency: string;
    pulling_awareness: string;

    successfully_stopped: string | boolean;
    how_long_stopped_days: number;

    emotion: string;
}

// Response from the ML model (FastAPI predict_friendly-compatible)
export interface PredictionResponse {
    risk_score: number;
    confidence: number;
    risk_bucket: RiskBucket;
    model_version?: string;
    risk_code?: string | number; // ✅ allow int from FastAPI
    runtime_sec?: number;
    debug?: unknown;
}

