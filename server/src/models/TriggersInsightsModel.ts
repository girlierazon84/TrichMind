// server/src/models/TriggersInsights.ts

import { Schema, model, Document, Types } from "mongoose";

/**---------------------------------------------------------------------------
⚡ Trigger Insights Model
Tracks user-specific behavioral or emotional triggers and their frequencies.
------------------------------------------------------------------------------**/
export interface ITrigger extends Document {
    userId: Types.ObjectId;
    name: string;          // trigger name (e.g. "stress", "boredom", "mirror")
    frequency: number;     // how often it occurs
    createdAt: Date;
    updatedAt: Date;
}

// This schema captures user triggers and their occurrence frequencies
const TriggerSchema = new Schema<ITrigger>(
    {
        // Reference to the User model
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
        // Name of the trigger
        name: { type: String, required: true, trim: true },
        // Frequency of the trigger occurrence
        frequency: { type: Number, default: 0, min: 0 },
    },
    // Automatically manage createdAt and updatedAt fields
    { timestamps: true }
);

// ⚡ Optimized indexes for querying most frequent triggers
TriggerSchema.index({ userId: 1, frequency: -1 });
TriggerSchema.index({ userId: 1, name: 1 }, { unique: false }); // same trigger allowed across users

// ✅ Use named export for consistency
export const Trigger = model<ITrigger>("Trigger", TriggerSchema);
