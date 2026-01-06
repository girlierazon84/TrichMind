// server/src/models/DailyCheckInModel.ts

import mongoose, { Schema, type HydratedDocument } from "mongoose";


export interface IDailyCheckIn {
    userId: mongoose.Types.ObjectId;
    day: string; // YYYY-MM-DD (stable key)
    relapsed: boolean;
    note?: string;
}

export type DailyCheckInDocument = HydratedDocument<IDailyCheckIn>;

const DailyCheckInSchema = new Schema<IDailyCheckIn>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        day: { type: String, required: true, trim: true },
        relapsed: { type: Boolean, required: true },
        note: { type: String, trim: true },
    },
    { timestamps: true }
);

// One entry per user per day
DailyCheckInSchema.index({ userId: 1, day: 1 }, { unique: true });

export const DailyCheckIn =
    (mongoose.models.DailyCheckIn as mongoose.Model<IDailyCheckIn>) ||
    mongoose.model<IDailyCheckIn>("DailyCheckIn", DailyCheckInSchema);

export default DailyCheckIn;
