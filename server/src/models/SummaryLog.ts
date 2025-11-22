// server/src/models/SummaryLog.ts

import { Schema, model, Document, Types } from "mongoose";

/**-----------------------------------------------------------
    📝 SummaryLog Model
    Tracks weekly summary logs for user sessions and risks.
--------------------------------------------------------------**/
export interface ISummaryLog extends Document {
    userId: Types.ObjectId;
    weekOf: Date;
    avgRisk?: number;
    topCoping?: string;
    streakDays?: number;
    totalSessions?: number;
    sentAt: Date;
    status: "sent" | "failed";
}

const SummaryLogSchema = new Schema<ISummaryLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        weekOf: { type: Date, required: true },
        avgRisk: { type: Number, min: 0, max: 1 },
        topCoping: { type: String, trim: true },
        streakDays: { type: Number, min: 0 },
        totalSessions: { type: Number, min: 0 },
        sentAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["sent", "failed"], default: "sent" },
    },
    { timestamps: true }
);

// ⚡ Optimize lookups per user and week
SummaryLogSchema.index({ userId: 1, weekOf: -1 });

export const SummaryLog = model<ISummaryLog>("SummaryLog", SummaryLogSchema);
