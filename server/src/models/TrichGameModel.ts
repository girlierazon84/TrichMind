// server/src/models/TrichGameModel.ts

import { Schema, model, Document, Types } from "mongoose";

/**---------------------------------------------------------------
    🎮 TrichGame Session Model
    Logs each interactive gameplay session from the mobile app.
------------------------------------------------------------------**/
export interface IGameSession extends Document {
    userId: Types.ObjectId;
    gameName: string;
    mode?: "calming" | "focus" | "breathing" | "tap" | string;
    score: number;
    streak: number;
    durationSeconds: number;
    startedAt: Date;
    endedAt?: Date;
    completed: boolean;
    metadata?: Record<string, any>;
}

// Mongoose Schema for TrichGame Sessions
const GameSessionSchema = new Schema<IGameSession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            required: true,
        },
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

// Export the Mongoose model
export const GameSession = model<IGameSession>(
    "GameSession",
    GameSessionSchema
);

export default GameSession;
