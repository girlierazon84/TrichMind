// server/src/models/DailyCheckInModel.ts

import mongoose, { Schema, type HydratedDocument } from "mongoose";


export interface IDailyCheckIn {
  userId: string;        // auth user id
  day: string;           // YYYY-MM-DD (UTC-based key)
  relapsed: boolean;     // true = pulled today
  note?: string;         // optional note
}

export type DailyCheckInDocument = HydratedDocument<IDailyCheckIn>;

const DailyCheckInSchema = new Schema<IDailyCheckIn>(
    {
        userId: { type: String, required: true, index: true },
        day: { type: String, required: true, index: true }, // YYYY-MM-DD
        relapsed: { type: Boolean, required: true, default: false },
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
