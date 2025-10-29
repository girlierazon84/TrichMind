// server/src/models/TrichGame.ts
import { Schema, model, Document, Types } from "mongoose";

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
        gameName: { type: String, default: "TrichGame" },
        mode: { type: String },
        score: { type: Number, default: 0, min: 0 },
        streak: { type: Number, default: 0, min: 0 },
        durationSeconds: { type: Number, default: 0, min: 0 },
        startedAt: { type: Date, default: Date.now },
        endedAt: { type: Date },
        completed: { type: Boolean, default: false },
        metadata: { type: Schema.Types.Mixed }
    },
    { timestamps: true }
);

GameSessionSchema.index({ userId: 1, createdAt: -1 });

export default model<IGameSession>("GameSession", GameSessionSchema);
