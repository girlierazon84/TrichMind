// server/src/models/AlertLog.ts

import mongoose, {
    Schema,
    type Types,
    type HydratedDocument
} from "mongoose";


/**-----------------------
    🚨 AlertLog Model
--------------------------*/
// Logs alerts triggered for users based on their scores.
export interface IAlertLog {
    userId: Types.ObjectId;
    score: number; // 0..1
    triggeredAt: Date;
    sent: boolean;
    email?: string;
    error?: string;
}

// Mongoose Document type for AlertLog
export type AlertLogDocument = HydratedDocument<IAlertLog>;

// Mongoose Schema for AlertLog
const AlertLogSchema = new Schema<IAlertLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        score: { type: Number, min: 0, max: 1, required: true },
        triggeredAt: { type: Date, default: Date.now },
        sent: { type: Boolean, default: false },
        email: { type: String, trim: true, lowercase: true },
        error: { type: String, trim: true },
    },
    { timestamps: true }
);

// Compound index to optimize queries for recent alerts per user
AlertLogSchema.index({ userId: 1, triggeredAt: -1 });

// Mongoose Model for AlertLog
export const AlertLog =
    (mongoose.models.AlertLog as mongoose.Model<IAlertLog>) ||
    mongoose.model<IAlertLog>("AlertLog", AlertLogSchema);

export default AlertLog;
