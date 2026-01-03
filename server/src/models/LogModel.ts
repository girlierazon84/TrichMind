// server/src/models/LogModel.ts

import mongoose, {
    Schema,
    type Types,
    type HydratedDocument
} from "mongoose";


/**------------------
    🧾 Log Model
---------------------*/
// Log levels and categories
export type LogLevel = "info" | "warning" | "error" | "debug";
export type LogCategory =
    | "auth"
    | "ml"
    | "ui"
    | "network"
    | "alert"
    | "summary"
    | "game"
    | "bot"
    | "journal"
    | "health"
    | "system"
    | "unknown";

// Log event interface
export interface ILogEvent {
    userId?: Types.ObjectId;
    level: LogLevel;
    category: LogCategory;
    message: string;
    context?: Record<string, unknown>;
    timestamp: Date;
}

// Mongoose document type
export type LogEventDocument = HydratedDocument<ILogEvent>;

// Log schema definition
const LogSchema = new Schema<ILogEvent>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },

        level: {
            type: String,
            enum: ["info", "warning", "error", "debug"],
            default: "info",
            index: true,
        },

        // Categories of the log event
        category: {
            type: String,
            enum: [
                "auth",
                "ml",
                "ui",
                "network",
                "alert",
                "summary",
                "game",
                "bot",
                "journal",
                "health",
                "system",
                "unknown"
            ],
            default: "unknown",
            index: true,
        },

        // Log message and context
        message: { type: String, required: true, trim: true },
        context: { type: Schema.Types.Mixed, default: {} },

        // Timestamp of the log event
        timestamp: { type: Date, default: Date.now },
    },
    // Schema options
    { timestamps: true }
);

// Indexes for efficient querying
LogSchema.index({ level: 1, category: 1, createdAt: -1 });
LogSchema.index({ userId: 1, createdAt: -1 });

// LogEvent model
export const LogEvent =
    (mongoose.models.LogEvent as mongoose.Model<ILogEvent>) ||
    mongoose.model<ILogEvent>("LogEvent", LogSchema);

export default LogEvent;
