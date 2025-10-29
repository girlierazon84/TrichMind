// server/src/models/TrichBot.ts
import { Schema, model, Document, Types } from "mongoose";

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

const TrichBotSchema = new Schema<ITrichBotMessage>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
        prompt: { type: String, required: true, trim: true },
        response: { type: String, required: true, trim: true },
        tips: [{ type: String, trim: true }],
        riskScore: { type: Number, min: 0, max: 1 },
        intent: { type: String },
        modelInfo: {
            name: { type: String },
            version: { type: String }
        },
        feedback: {
            helpful: { type: Boolean },
            rating: { type: Number, min: 1, max: 5 },
            comment: { type: String, trim: true }
        }
    },
    { timestamps: true }
);

TrichBotSchema.index({ userId: 1, createdAt: -1 });

export default model<ITrichBotMessage>("TrichBotMessage", TrichBotSchema);
