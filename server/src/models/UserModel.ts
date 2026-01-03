// server/src/models/UserModel.ts

import mongoose, {
    Schema,
    type HydratedDocument
} from "mongoose";
import bcrypt from "bcryptjs";


/**---------------------
    User Model Types
------------------------*/

// Methods live separately so TS + Mongoose can infer them correctly
export interface IUserMethods {
    compare(pw: string): Promise<boolean>;
    comparePassword(pw: string): Promise<boolean>;
}

// IUser = document fields ONLY (no _id method declarations here)
export interface IUser {
    email: string;
    password: string;

    displayName?: string;
    date_of_birth?: Date;

    age?: number;
    age_of_onset?: number;
    years_since_onset?: number;

    pulling_severity?: number;
    pulling_frequency?: string;
    pulling_awareness?: string;
    successfully_stopped?: string | boolean;
    how_long_stopped_days?: number;

    pulling_frequency_encoded?: number;
    awareness_level_encoded?: number;
    successfully_stopped_encoded?: boolean;
    how_long_stopped_days_est?: number;

    emotion?: string;
    avatarUrl?: string;

    coping_worked?: string[];
    coping_not_worked?: string[];
}

// Hydrated document = fields + mongoose doc + methods
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

/**-------------------------
    User Schema
----------------------------*/
// Define schema
const UserSchema = new Schema<IUser, mongoose.Model<IUser, {}, IUserMethods>, IUserMethods>(
    {
        email: { type: String, unique: true, required: true, lowercase: true, trim: true },
        password: { type: String, required: true },

        displayName: { type: String, trim: true },

        date_of_birth: { type: Date },
        age: { type: Number },
        age_of_onset: { type: Number },
        years_since_onset: { type: Number },

        pulling_severity: { type: Number },
        pulling_frequency: { type: String, trim: true },
        pulling_awareness: { type: String, trim: true },
        successfully_stopped: { type: Schema.Types.Mixed },
        how_long_stopped_days: { type: Number },

        pulling_frequency_encoded: { type: Number },
        awareness_level_encoded: { type: Number },
        successfully_stopped_encoded: { type: Boolean },
        how_long_stopped_days_est: { type: Number },

        emotion: { type: String, trim: true },
        avatarUrl: { type: String, trim: true },

        coping_worked: { type: [String], default: [] },
        coping_not_worked: { type: [String], default: [] },
    },
    { timestamps: true }
);

// 🔐 Hash password before save
UserSchema.pre("save", async function () {
    const self = this as UserDocument;
    if (!self.isModified("password")) return;
    self.password = await bcrypt.hash(self.password, 10);
});

// 🔑 Compare password
UserSchema.method("compare", function (pw: string) {
    return bcrypt.compare(pw, (this as UserDocument).password);
});

// 🔑 Compare password (alias)
UserSchema.method("comparePassword", function (pw: string) {
    return bcrypt.compare(pw, (this as UserDocument).password);
});

// 🧮 Auto-calc years_since_onset (best-effort)
UserSchema.pre("save", function () {
    const self = this as UserDocument;

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
});

// Export model (include methods in typing)
export const User =
    (mongoose.models.User as mongoose.Model<IUser, {}, IUserMethods>) ||
    mongoose.model<IUser, mongoose.Model<IUser, {}, IUserMethods>>("User", UserSchema);

export default User;
