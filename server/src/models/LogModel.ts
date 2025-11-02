// server/src/models/LogModel.ts

import { Schema, model, Document, Types } from "mongoose";

/**-------------------------------------------------
🧾 Log Model
Centralized structured logging for all app layers:
- Frontend events (UI, auth, network, etc.)
- Backend activity (system, API, ML)
- ML risk or behavior insights
----------------------------------------------------**/
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

// This schema captures structured log events
const LogSchema = new Schema<ILogEvent>(
    {
        // Optional reference to the user related to the log event
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },

        // Severity level of the log
        level: {
            type: String,
            enum: ["info", "warning", "error", "debug"],
            default: "info",
            index: true,
        },

        // Categorize log events for filtering
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

        // Descriptive message of the log event
        message: { type: String, required: true, trim: true },

        // Additional contextual data
        context: {
            type: Schema.Types.Mixed, // flexible for any key/value structure
            default: {},
        },

        // When the event occurred
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// 🔍 Optimize by level, category, and date
LogSchema.index({ level: 1, category: 1, createdAt: -1 });
LogSchema.index({ userId: 1, createdAt: -1 });

// ✅ Named export for consistency
export const LogEvent = model<ILogEvent>("LogEvent", LogSchema);
