// server/src/models/TrichGameModel.ts

import { Schema, model, Document, Types } from "mongoose";

/**----------------------------------------------------------
🎮 TrichGame Session Model
Logs each interactive gameplay session from the mobile app.
-------------------------------------------------------------**/
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

// Schema to log gameplay sessions with scores, modes, and timestamps.
const GameSessionSchema = new Schema<IGameSession>(
    {
        // Reference to User model
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
        // Name of the game played
        gameName: { type: String, default: "TrichGame", trim: true },
        // Mode of the game session
        mode: { type: String, trim: true },
        // Performance metrics
        score: { type: Number, default: 0, min: 0 },
        // Current streak of successful actions
        streak: { type: Number, default: 0, min: 0 },
        // Duration of the game session
        durationSeconds: { type: Number, default: 0, min: 0 },
        // Timestamps for session tracking
        startedAt: { type: Date, default: Date.now },
        // Optional end time for the session
        endedAt: { type: Date },
        // Whether the session was completed
        completed: { type: Boolean, default: false },
        // Additional flexible metadata
        metadata: { type: Schema.Types.Mixed },
    },
    // Enable automatic createdAt and updatedAt timestamps
    { timestamps: true }
);

// ⚡ Index for fast lookup of latest sessions per user
GameSessionSchema.index({ userId: 1, createdAt: -1 });

// ✅ Use named export for consistency across models
export const GameSession = model<IGameSession>("GameSession", GameSessionSchema);
