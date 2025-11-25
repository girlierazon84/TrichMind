// server/src/models/JournalEntry.ts

import { Schema, model, Document, Types } from "mongoose";
import type { MoodName } from "../schemas/journalSchema";

/**----------------------------------------------------------
    📝 JournalEntry Model
    Captures user journal entries and associated metadata.
    Numeric fields are 0..10 intensity scores for ML.
-------------------------------------------------------------**/
export interface IJournalEntry extends Document {
    userId: Types.ObjectId;
    prompt?: string;
    text: string;
    mood?: MoodName;      // e.g. "Sad", "Anxious", "Bored", etc.

    // clustered mood intensities
    stress?: number;      // 0..10
    calm?: number;        // 0..10
    happy?: number;       // 0..10

    // overall urge intensity before / after pulling
    urgeIntensity?: number; // 0..10

    createdAt: Date;
    updatedAt: Date;
}

// Define the JournalEntry schema
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

        // clustered mood intensities
        stress: { type: Number, min: 0, max: 10 },
        calm: { type: Number, min: 0, max: 10 },
        happy: { type: Number, min: 0, max: 10 },

        // overall urge intensity
        urgeIntensity: { type: Number, min: 0, max: 10 },
    },
    { timestamps: true }
);

// ⚡ Optimize retrieval of latest entries per user
JournalEntrySchema.index({ userId: 1, createdAt: -1 });

// ✅ Named export — no default export
export const JournalEntry = model<IJournalEntry>("JournalEntry", JournalEntrySchema);

export default JournalEntry;
