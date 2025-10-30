// server/src/models/User.ts

import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    _id: Types.ObjectId; // ✅ Add this line
    email: string;
    password: string;
    displayName?: string;
    date_of_birth?: Date;
    age_of_onset?: number;
    years_since_onset?: number;
    pulling_severity?: number;
    pulling_frequency_encoded?: number;
    awareness_level_encoded?: number;
    successfully_stopped_encoded?: boolean;
    how_long_stopped_days_est: number;
    emotion?: string;
    compare(pw: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, unique: true, required: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        displayName: { type: String, trim: true },
        date_of_birth: Date,
        age_of_onset: Number,
        years_since_onset: Number,
        pulling_severity: Number,
        pulling_frequency_encoded: Number,
        awareness_level_encoded: Number,
        successfully_stopped_encoded: Boolean,
        how_long_stopped_days_est: Number,
        emotion: { type: String, trim: true },
    },
    { timestamps: true }
);

// 🔐 Hash password before save
UserSchema.pre("save", async function (next) {
    const self = this as IUser;
    if (!self.isModified("password")) return next();
    self.password = await bcrypt.hash(self.password, 10);
    next();
});

// 🔑 Compare password
UserSchema.methods.compare = function (pw: string) {
    return bcrypt.compare(pw, this.password);
};

// 🧮 Auto-calculate years_since_onset
UserSchema.pre("save", function (next) {
    const self = this as IUser;
    if (self.date_of_birth && typeof self.age_of_onset === "number") {
        const today = new Date();
        const dob = new Date(self.date_of_birth);
        let age = today.getFullYear() - dob.getFullYear();
        const hadBirthday =
            today.getMonth() > dob.getMonth() ||
            (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
        if (!hadBirthday) age -= 1;
        self.years_since_onset = Math.max(0, age - self.age_of_onset);
    }
    next();
});

export const User = model<IUser>("User", UserSchema); // ✅ Named export
