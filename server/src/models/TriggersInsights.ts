// server/src/models/TriggersInsights.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ITrigger extends Document {
    userId: Types.ObjectId;
    name: string;
    frequency: number;
    createdAt: Date;
    updatedAt: Date;
}

const TriggerSchema = new Schema<ITrigger>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
        name: { type: String, required: true, trim: true },
        frequency: { type: Number, default: 0, min: 0 }
    },
    { timestamps: true }
);

TriggerSchema.index({ userId: 1, frequency: -1 });
TriggerSchema.index({ userId: 1, name: 1 }, { unique: false }); // allow duplicates across users

export default model<ITrigger>("Trigger", TriggerSchema);
