// server/src/models/HealthLog.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IHealthLog extends Document {
    userId: Types.ObjectId;
    sleepHours: number;        // 0..24
    stressLevel: number;       // 0..10
    exerciseMinutes: number;   // 0..1440
    date: Date;

    // 🧠 ML-Driven Relapse Risk Data
    relapseRisk?: {
        score?: number;        // 0..1 — predicted probability
        bucket?: "low" | "medium" | "high" | "unknown"; // risk level
        confidence?: number;   // optional model confidence (0..1)
    };

    createdAt: Date;
    updatedAt: Date;
}

const HealthLogSchema = new Schema<IHealthLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            required: true,
        },

        sleepHours: { type: Number, min: 0, max: 24, default: 7 },
        stressLevel: { type: Number, min: 0, max: 10, default: 5 },
        exerciseMinutes: { type: Number, min: 0, max: 1440, default: 0 },
        date: { type: Date, default: Date.now },

        // 🧠 New ML Prediction Field
        relapseRisk: {
            score: { type: Number, min: 0, max: 1, default: null },
            bucket: {
                type: String,
                enum: ["low", "medium", "high", "unknown"],
                default: "unknown",
            },
            confidence: { type: Number, min: 0, max: 1, default: null },
        },
    },
    { timestamps: true }
);

// Index for fast lookups by user and most recent date
HealthLogSchema.index({ userId: 1, date: -1 });

export default model<IHealthLog>("HealthLog", HealthLogSchema);
