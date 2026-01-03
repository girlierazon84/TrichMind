// server/src/models/TrichBotModel.ts

import mongoose, { Schema, type Types, type HydratedDocument } from "mongoose";


/**-------------------------------
    🤖 TrichBot Message Model
----------------------------------*/

// Interface for TrichBotMessage document
export interface ITrichBotMessage {
    userId: Types.ObjectId;
    prompt: string;
    response: string;

    tips?: string[];
    riskScore?: number; // 0..1
    intent?: string;

    modelInfo?: { name?: string; version?: string };
    feedback?: { helpful?: boolean; rating?: number; comment?: string };
}

// Mongoose Document type for TrichBotMessage
export type TrichBotMessageDocument = HydratedDocument<ITrichBotMessage>;

// Mongoose Schema for TrichBotMessage
const TrichBotSchema = new Schema<ITrichBotMessage>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },

        prompt: { type: String, required: true, trim: true },
        response: { type: String, required: true, trim: true },

        tips: [{ type: String, trim: true }],
        riskScore: { type: Number, min: 0, max: 1 },
        intent: { type: String, trim: true },

        modelInfo: {
            name: { type: String, trim: true },
            version: { type: String, trim: true },
        },

        feedback: {
            helpful: { type: Boolean },
            rating: { type: Number, min: 1, max: 5 },
            comment: { type: String, trim: true },
        },
    },
    { timestamps: true }
);

// Compound index to optimize queries by userId and createdAt
TrichBotSchema.index({ userId: 1, createdAt: -1 });

// Mongoose Model for TrichBotMessage
export const TrichBotMessage =
    (mongoose.models.TrichBotMessage as mongoose.Model<ITrichBotMessage>) ||
    mongoose.model<ITrichBotMessage>("TrichBotMessage", TrichBotSchema);

export default TrichBotMessage;
