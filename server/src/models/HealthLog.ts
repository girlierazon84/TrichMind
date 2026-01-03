// server/src/models/HealthLog.ts

import mongoose, {
    Schema,
    type Types,
    type HydratedDocument
} from "mongoose";


/**------------------------
    🩺 HealthLog Model
---------------------------*/
export type HealthRiskBucket = "low" | "medium" | "high" | "unknown";

// Snapshot of relapse risk at the time of the health log
export interface IRelapseRiskSnapshot {
    score?: number | null; // 0..1
    bucket?: HealthRiskBucket;
    confidence?: number | null; // 0..1
}

// Health log entry for a user on a specific date
export interface IHealthLog {
    userId: Types.ObjectId;

    sleepHours: number; // 0..24
    stressLevel: number; // 0..10
    exerciseMinutes: number; // 0..1440
    date: Date;

    relapseRisk?: IRelapseRiskSnapshot;
}

// Mongoose Document type
export type HealthLogDocument = HydratedDocument<IHealthLog>;

// Mongoose Schema
const RelapseRiskSchema = new Schema<IRelapseRiskSnapshot>(
    {
        score: { type: Number, min: 0, max: 1, default: null },
        bucket: {
            type: String,
            enum: ["low", "medium", "high", "unknown"],
            default: "unknown",
        },
        confidence: { type: Number, min: 0, max: 1, default: null },
    },
    { _id: false } // embedded subdoc, no separate _id
);

// Main HealthLog schema
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

        date: { type: Date, default: Date.now, index: true },

        relapseRisk: { type: RelapseRiskSchema, default: undefined },
    },
    { timestamps: true }
);

// Common queries: trend charts & latest health log
HealthLogSchema.index({ userId: 1, date: -1 });
HealthLogSchema.index({ userId: 1, createdAt: -1 });

// Mongoose Model
export const HealthLog =
    (mongoose.models.HealthLog as mongoose.Model<IHealthLog>) ||
    mongoose.model<IHealthLog>("HealthLog", HealthLogSchema);

export default HealthLog;
