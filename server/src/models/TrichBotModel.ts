// server/src/models/TrichBotModel.ts

import { Schema, model, Document, Types } from "mongoose";

/**----------------------------------------------------------------------
    🤖 TrichBot Message Model
    Stores all AI chat interactions, user prompts, and bot responses.
-------------------------------------------------------------------------**/

// Use Omit<Document, "model"> so we can safely define our own `model` field
export interface ITrichBotMessage extends Omit<Document, "model"> {
    userId: Types.ObjectId;
    prompt: string;
    response: string;
    tips?: string[];
    riskScore?: number;
    intent?: string;
    model?: { name?: string; version?: string }; // <- our own metadata field
    feedback?: { helpful?: boolean; rating?: number; comment?: string };
    createdAt: Date;
    updatedAt: Date;
}

const TrichBotSchema = new Schema<ITrichBotMessage>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            required: true,
        },
        prompt: { type: String, required: true, trim: true },
        response: { type: String, required: true, trim: true },
        tips: [{ type: String, trim: true }],
        riskScore: { type: Number, min: 0, max: 1 },
        intent: { type: String, trim: true },
        model: {
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

// ⚡ Optimize queries by user and recency
TrichBotSchema.index({ userId: 1, createdAt: -1 });

export const TrichBotMessage = model<ITrichBotMessage>(
    "TrichBotMessage",
    TrichBotSchema
);

export default TrichBotMessage;
