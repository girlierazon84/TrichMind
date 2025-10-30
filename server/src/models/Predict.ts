// server/src/models/Predict.ts
import { Schema, model, Document, Types } from "mongoose";

/**
 * 🧠 Predict Model
 * Stores each relapse risk prediction request and result.
 */
export interface IPredict extends Document {
    userId: Types.ObjectId;

    // Input features sent to FastAPI
    age: number;
    age_of_onset: number;
    years_since_onset: number;
    pulling_severity: number;
    pulling_frequency_encoded: number;
    awareness_level_encoded: number;
    successfully_stopped_encoded: number;
    how_long_stopped_days_est: number;
    emotion: string;

    // ML prediction outputs
    risk_score?: number; // 0–1
    risk_bucket?: "low" | "medium" | "high";
    confidence?: number; // 0–1

    // Metadata
    model_version?: string;
    served_by?: string; // e.g., "FastAPI", "v2.2.0"
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
        pulling_frequency_encoded: { type: Number, min: 0, max: 5, required: true },
        awareness_level_encoded: { type: Number, min: 0, max: 1, required: true },
        successfully_stopped_encoded: { type: Number, min: 0, max: 1, default: 0 },
        how_long_stopped_days_est: { type: Number, min: 0, default: 0 },
        emotion: { type: String, default: "unknown", trim: true },

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

// ⚡ Optimize queries by user and creation time
PredictSchema.index({ userId: 1, createdAt: -1 });

// ✅ Named export — no default export
export const Predict = model<IPredict>("Predict", PredictSchema);
