// server/src/models/HealthLog.ts

import { Schema, model, Document, Types } from "mongoose";

/**----------------------------------------------------------------
    🩺 HealthLog Model
    Tracks user health metrics and potential relapse indicators.
-------------------------------------------------------------------**/
export interface IHealthLog extends Document {
    userId: Types.ObjectId;
    sleepHours: number;        // 0–24
    stressLevel: number;       // 0–10
    exerciseMinutes: number;   // 0–1440
    date: Date;
    relapseRisk?: {
        score?: number;          // 0–1
        bucket?: "low" | "medium" | "high" | "unknown";
        confidence?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

// ⚙️ Define HealthLog schema
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

// ⚡ Optimize queries by user + date
HealthLogSchema.index({ userId: 1, date: -1 });

// ✅ Use named export (no default)
export const HealthLog = model<IHealthLog>("HealthLog", HealthLogSchema);

export default HealthLog;
