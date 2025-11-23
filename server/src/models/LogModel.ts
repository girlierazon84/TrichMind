// server/src/models/LogModel.ts

import { Schema, model, Document, Types } from "mongoose";

/**------------------------------------------------------
    🧾 Log Model
    Centralized structured logging for all app layers.
---------------------------------------------------------**/
export interface ILogEvent extends Document {
    userId?: Types.ObjectId;
    level: "info" | "warning" | "error" | "debug";
    category:
        | "auth"
        | "ml"
        | "ui"
        | "network"
        | "alert"
        | "summary"
        | "system"
        | "unknown";
    message: string;
    context?: Record<string, any>;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Mongoose Schema for Log Events
const LogSchema = new Schema<ILogEvent>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        level: {
            type: String,
            enum: ["info", "warning", "error", "debug"],
            default: "info",
            index: true,
        },
        category: {
            type: String,
            enum: [
                "auth",
                "ml",
                "ui",
                "network",
                "alert",
                "summary",
                "system",
                "unknown",
            ],
            default: "unknown",
            index: true,
        },
        message: { type: String, required: true, trim: true },
        context: {
            type: Schema.Types.Mixed,
            default: {},
        },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// 🔍 Optimize by level, category, and date
LogSchema.index({ level: 1, category: 1, createdAt: -1 });
LogSchema.index({ userId: 1, createdAt: -1 });

// Export the Mongoose model
export const LogEvent = model<ILogEvent>("LogEvent", LogSchema);

export default LogEvent;
