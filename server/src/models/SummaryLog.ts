// server/src/models/SummaryLog.ts

import mongoose, {
    Schema,
    type Types,
    type HydratedDocument
} from "mongoose";


/**-------------------------
    📝 SummaryLog Model
----------------------------*/
export type SummaryStatus = "sent" | "failed";

// Interface representing a summary log document
export interface ISummaryLog {
    // Required fields
    userId: Types.ObjectId;
    weekOf: Date;

    // Summary data fields
    avgRisk?: number;
    topCoping?: string;
    streakDays?: number;
    totalSessions?: number;

    // Metadata
    sentAt: Date;
    status: SummaryStatus;

    // Failure reason when status="failed"
    error?: string;
}

// Mongoose document type
export type SummaryLogDocument = HydratedDocument<ISummaryLog>;

// Mongoose schema definition
const SummaryLogSchema = new Schema<ISummaryLog>(
    {
        // Required fields
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        weekOf: { type: Date, required: true, index: true },

        // Summary data fields
        avgRisk: { type: Number, min: 0, max: 1 },
        topCoping: { type: String, trim: true },
        streakDays: { type: Number, min: 0 },
        totalSessions: { type: Number, min: 0 },

        // Metadata
        sentAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["sent", "failed"], default: "sent", index: true },

        // Failure reason when status="failed"
        error: { type: String, trim: true, default: undefined },
    },
    // Schema options
    { timestamps: true }
);

// One summary per user per week (newest first)
SummaryLogSchema.index({ userId: 1, weekOf: -1 });

// Mongoose model export
export const SummaryLog =
    (mongoose.models.SummaryLog as mongoose.Model<ISummaryLog>) ||
    mongoose.model<ISummaryLog>("SummaryLog", SummaryLogSchema);

export default SummaryLog;
