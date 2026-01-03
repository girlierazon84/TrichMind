// server/src/models/TrichGameModel.ts

import mongoose, {
    Schema,
    type Types,
    type HydratedDocument
} from "mongoose";


/**--------------------------------
    🎮 TrichGame Session Model
-----------------------------------*/
// Model for storing user game session data for TrichGame.
export interface IGameSession {
    userId: Types.ObjectId;
    gameName: string;
    mode?: "calming" | "focus" | "breathing" | "tap" | string;

    score: number;
    streak: number;
    durationSeconds: number;

    startedAt: Date;
    endedAt?: Date;
    completed: boolean;

    metadata?: Record<string, unknown>;
}

// Mongoose Document type for IGameSession
export type GameSessionDocument = HydratedDocument<IGameSession>;

// Mongoose Schema for GameSession
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

        metadata: { type: Schema.Types.Mixed, default: undefined },
    },
    { timestamps: true }
);

// Compound index to optimize queries by userId and creation date
GameSessionSchema.index({ userId: 1, createdAt: -1 });

// Mongoose Model for GameSession
export const GameSession =
    (mongoose.models.GameSession as mongoose.Model<IGameSession>) ||
    mongoose.model<IGameSession>("GameSession", GameSessionSchema);

export default GameSession;
