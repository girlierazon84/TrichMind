// server/src/models/PredictModel.ts

import { Schema, model, Document, Types } from "mongoose";

/**-----------------------------------------------------------
    🧠 Predict Model
    Stores each relapse risk prediction request and result.
    Aligned with the *friendly* DTO shape.
--------------------------------------------------------------**/
export interface IPredict extends Document {
    userId: Types.ObjectId;

    // Friendly input features sent from client
    age: number;
    age_of_onset: number;
    years_since_onset: number;

    pulling_severity: number;

    // Friendly fields (strings / boolean-like)
    pulling_frequency: string;
    pulling_awareness: string;
    successfully_stopped: string | boolean;
    how_long_stopped_days: number;
    emotion: string;

    // Optional lifestyle fields
    sleepHours?: number;
    stressLevel?: number;
    exerciseMinutes?: number;

    // Optional encoded fields
    pulling_frequency_encoded?: number;
    awareness_level_encoded?: number;
    successfully_stopped_encoded?: number;
    how_long_stopped_days_est?: number;
    emotion_intensity_sum?: number;

    // ML prediction outputs
    risk_score?: number; // 0–1
    risk_bucket?: "low" | "medium" | "high";
    confidence?: number; // 0–1

    // Metadata
    model_version?: string;
    served_by?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PredictSchema = new Schema<IPredict>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            required: true,
        },

        age: { type: Number, min: 0, max: 120, required: true },
        age_of_onset: { type: Number, min: 0, max: 120, required: true },
        years_since_onset: { type: Number, min: 0, required: true },

        pulling_severity: { type: Number, min: 0, max: 10, required: true },

        pulling_frequency: { type: String, required: true, trim: true },
        pulling_awareness: { type: String, required: true, trim: true },
        successfully_stopped: { type: Schema.Types.Mixed, required: true },
        how_long_stopped_days: { type: Number, min: 0, required: true },
        emotion: { type: String, default: "unknown", trim: true },

        sleepHours: { type: Number, min: 0, max: 24, default: undefined },
        stressLevel: { type: Number, min: 0, max: 10, default: undefined },
        exerciseMinutes: {
            type: Number,
            min: 0,
            max: 1440,
            default: undefined,
        },

        pulling_frequency_encoded: {
            type: Number,
            min: 0,
            max: 5,
            default: undefined,
        },
        awareness_level_encoded: {
            type: Number,
            min: 0,
            max: 1,
            default: undefined,
        },
        successfully_stopped_encoded: {
            type: Number,
            min: 0,
            max: 1,
            default: undefined,
        },
        how_long_stopped_days_est: {
            type: Number,
            min: 0,
            default: undefined,
        },
        emotion_intensity_sum: {
            type: Number,
            min: 0,
            default: undefined,
        },

        risk_score: { type: Number, min: 0, max: 1, default: null },
        risk_bucket: {
            type: String,
            enum: ["low", "medium", "high"],
            default: null,
        },
        confidence: { type: Number, min: 0, max: 1, default: null },

        model_version: { type: String, default: "unknown" },
        served_by: { type: String, default: "FastAPI" },
    },
    { timestamps: true }
);

PredictSchema.index({ userId: 1, createdAt: -1 });

export const Predict = model<IPredict>("Predict", PredictSchema);
