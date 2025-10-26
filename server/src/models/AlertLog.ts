// server/src/models/AlertLog.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IAlertLog extends Document {
    userId: Types.ObjectId;
    score: number;
    triggeredAt: Date;
    sent: boolean;
    email?: string;
    error?: string;
}

const AlertLogSchema = new Schema<IAlertLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        score: { type: Number, min: 0, max: 1, required: true },
        triggeredAt: { type: Date, default: Date.now },
        sent: { type: Boolean, default: false },
        email: { type: String },
        error: { type: String },
    },
    { timestamps: true }
);

AlertLogSchema.index({ userId: 1, triggeredAt: -1 });

export default model<IAlertLog>("AlertLog", AlertLogSchema);
