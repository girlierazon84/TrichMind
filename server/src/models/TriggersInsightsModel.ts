// server/src/models/TriggersInsights.ts

import { Schema, model, Document, Types } from "mongoose";

/**--------------------------------------------------------------------------------
    ⚡ Trigger Insights Model
    Tracks user-specific behavioral or emotional triggers and their frequencies.
-----------------------------------------------------------------------------------**/
export interface ITrigger extends Document {
    userId: Types.ObjectId;
    name: string;
    frequency: number;
    createdAt: Date;
    updatedAt: Date;
}

const TriggerSchema = new Schema<ITrigger>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            required: true,
        },
        name: { type: String, required: true, trim: true },
        frequency: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

// ⚡ Optimized indexes for querying most frequent triggers
TriggerSchema.index({ userId: 1, frequency: -1 });
TriggerSchema.index({ userId: 1, name: 1 }, { unique: false });

export const Trigger = model<ITrigger>("Trigger", TriggerSchema);
