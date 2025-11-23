// server/src/models/TrichBotModel.ts

import { Schema, model, Document, Types } from "mongoose";

/**----------------------------------------------------------------------
    🤖 TrichBot Message Model
    Stores all AI chat interactions, user prompts, and bot responses.
-------------------------------------------------------------------------**/
export interface ITrichBotMessage extends Document {
    userId: Types.ObjectId;
    prompt: string;                        // user message
    response: string;                      // bot reply
    tips?: string[];                       // quick actionable tips shown
    riskScore?: number;                    // 0..1 (optional)
    intent?: string;                       // e.g. "urge_support", "journaling_help"
    modelInfo?: { name?: string; version?: string };
    feedback?: { helpful?: boolean; rating?: number; comment?: string };
    createdAt: Date;
    updatedAt: Date;
}

// This schema captures user prompts, bot responses, risk scores, and feedback.
const TrichBotSchema = new Schema<ITrichBotMessage>(
    {
        // Reference to User model
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
        // User's input message
        prompt: { type: String, required: true, trim: true },
        // Bot's generated response
        response: { type: String, required: true, trim: true },
        // Actionable tips provided by the bot
        tips: [{ type: String, trim: true }],
        // Risk assessment score (0 to 1)
        riskScore: { type: Number, min: 0, max: 1 },
        // Detected user intent
        intent: { type: String, trim: true },
        // Information about the AI model used
        modelInfo: {
            name: { type: String, trim: true },
            version: { type: String, trim: true },
        },
        // User feedback on the bot's response
        feedback: {
            helpful: { type: Boolean },
            rating: { type: Number, min: 1, max: 5 },
            comment: { type: String, trim: true },
        },
    },
    // Enable automatic createdAt and updatedAt timestamps
    { timestamps: true }
);

// ⚡ Optimize queries by user and recency
TrichBotSchema.index({ userId: 1, createdAt: -1 });

// ✅ Use named export for consistency
export const TrichBotMessage = model<ITrichBotMessage>("TrichBotMessage", TrichBotSchema);

export default TrichBotMessage;
