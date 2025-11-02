// server/src/models/AlertLog.ts

import { Schema, model, Document, Types } from "mongoose";


/**-------------------------------------------------------
🚨 AlertLog Model
Records high-risk relapse alerts and email notifications.
----------------------------------------------------------**/
export interface IAlertLog extends Document {
    userId: Types.ObjectId;
    score: number;           // risk score (0–1)
    triggeredAt: Date;       // time of alert trigger
    sent: boolean;           // whether email/notification was sent
    email?: string;          // recipient email (if applicable)
    error?: string;          // any error encountered when sending
    createdAt: Date;
    updatedAt: Date;
}

// 🛠️ Schema definition
const AlertLogSchema = new Schema<IAlertLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        score: { type: Number, min: 0, max: 1, required: true },
        triggeredAt: { type: Date, default: Date.now },
        sent: { type: Boolean, default: false },
        email: { type: String, trim: true, lowercase: true },
        error: { type: String, trim: true },
    },
    { timestamps: true }
);

// ⚡ Optimize queries for user and recent alerts
AlertLogSchema.index({ userId: 1, triggeredAt: -1 });

// ✅ Named export for consistency
export const AlertLog = model<IAlertLog>("AlertLog", AlertLogSchema);
