// server/src/models/TrichGame.ts
import { Schema, model, Document, Types } from "mongoose";

/**
 * 🎮 TrichGame Session Model
 * Logs each interactive gameplay session from the mobile app.
 */
export interface IGameSession extends Document {
    userId: Types.ObjectId;
    gameName: string;                      // e.g. "TrichGame"
    mode?: "calming" | "focus" | "breathing" | "tap" | string;
    score: number;
    streak: number;
    durationSeconds: number;               // computed or sent from client
    startedAt: Date;
    endedAt?: Date;
    completed: boolean;
    metadata?: Record<string, any>;        // flexible per mini-game
}

const GameSessionSchema = new Schema<IGameSession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
        gameName: { type: String, default: "TrichGame", trim: true },
        mode: { type: String, trim: true },
        score: { type: Number, default: 0, min: 0 },
        streak: { type: Number, default: 0, min: 0 },
        durationSeconds: { type: Number, default: 0, min: 0 },
        startedAt: { type: Date, default: Date.now },
        endedAt: { type: Date },
        completed: { type: Boolean, default: false },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

// ⚡ Index for fast lookup of latest sessions per user
GameSessionSchema.index({ userId: 1, createdAt: -1 });

// ✅ Use named export for consistency across models
export const GameSession = model<IGameSession>("GameSession", GameSessionSchema);
