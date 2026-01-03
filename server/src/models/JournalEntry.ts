// server/src/models/JournalEntry.ts

import mongoose, {
    Schema,
    type Types,
    type HydratedDocument
} from "mongoose";
import type { MoodName } from "../schemas";


/**---------------------------
    📝 JournalEntry Model
------------------------------*/
// Represents a journal entry made by a user.
export interface IJournalEntry {
    userId: Types.ObjectId;

    prompt?: string;
    text: string;

    mood?: MoodName;

    stress?: number; // 0..10
    calm?: number; // 0..10
    happy?: number; // 0..10

    urgeIntensity?: number; // 0..10

    preUrgeTriggers?: string[];
    preUrgeTriggerNotes?: string;
}

// Mongoose Document type for JournalEntry
export type JournalEntryDocument = HydratedDocument<IJournalEntry>;

// Mongoose Schema definition for JournalEntry
const JournalEntrySchema = new Schema<IJournalEntry>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },

        prompt: { type: String, trim: true },
        text: { type: String, trim: true, default: "" },

        mood: { type: String, trim: true },

        stress: { type: Number, min: 0, max: 10 },
        calm: { type: Number, min: 0, max: 10 },
        happy: { type: Number, min: 0, max: 10 },

        urgeIntensity: { type: Number, min: 0, max: 10 },

        preUrgeTriggers: { type: [String], default: [] },
        preUrgeTriggerNotes: { type: String, trim: true },
    },
    { timestamps: true }
);

// Compound index to optimize queries fetching entries by user and creation date
JournalEntrySchema.index({ userId: 1, createdAt: -1 });

// Mongoose Model for JournalEntry
export const JournalEntry =
    (mongoose.models.JournalEntry as mongoose.Model<IJournalEntry>) ||
    mongoose.model<IJournalEntry>("JournalEntry", JournalEntrySchema);

export default JournalEntry;
