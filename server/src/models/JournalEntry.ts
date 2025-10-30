// server/src/models/JournalEntry.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IJournalEntry extends Document {
    userId: Types.ObjectId;
    prompt?: string;
    text: string;
    mood?: string;             // e.g., Calm / Sad / Happy / Stressed
    stress?: number;           // 0..10
    calm?: number;             // 0..10
    happy?: number;            // 0..10
    urgeIntensity?: number;    // 0..10
    createdAt: Date;
    updatedAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            required: true,
        },
        prompt: { type: String, trim: true },
        text: { type: String, trim: true, default: "" },
        mood: { type: String, trim: true },
        stress: { type: Number, min: 0, max: 10 },
        calm: { type: Number, min: 0, max: 10 },
        happy: { type: Number, min: 0, max: 10 },
        urgeIntensity: { type: Number, min: 0, max: 10 },
    },
    { timestamps: true }
);

// ⚡ Optimize retrieval of latest entries per user
JournalEntrySchema.index({ userId: 1, createdAt: -1 });

// ✅ Named export — no default export
export const JournalEntry = model<IJournalEntry>("JournalEntry", JournalEntrySchema);
