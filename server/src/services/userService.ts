// server/src/services/userService.ts

import { User, IUser } from "../models/User";
import { RegisterDTO, LoginDTO } from "../schemas/userSchema";
import { loggerService } from "./loggerService";
import bcrypt from "bcryptjs";

export const userService = {
    async register(data: RegisterDTO): Promise<IUser> {
        const existing = await User.findOne({ email: data.email.toLowerCase() });
        if (existing) throw new Error("Email already registered");

        const user = await User.create({
            ...data,
            email: data.email.toLowerCase(),
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
        });

        await loggerService.logInfo("New user registered", { userId: user._id, email: user.email });
        return user;
    },

    async login(data: LoginDTO): Promise<IUser> {
        const user = await User.findOne({ email: data.email.toLowerCase() });
        if (!user) {
            await loggerService.log("Login attempt with invalid email", "warning", "auth", { email: data.email });
            throw new Error("Invalid email or password");
        }

        const valid = await user.compare(data.password);
        if (!valid) {
            await loggerService.log("Invalid password attempt", "warning", "auth", { email: data.email });
            throw new Error("Invalid email or password");
        }

        await loggerService.logInfo("User logged in", { userId: user._id, email: user.email });
        return user;
    },

    async getById(id: string): Promise<IUser | null> {
        const user = await User.findById(id);
        if (!user) {
            await loggerService.log("User not found", "warning", "auth", { userId: id });
            return null;
        }
        return user;
    },

    async findByEmail(email: string): Promise<IUser | null> {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            await loggerService.log("User not found by email", "warning", "auth", { email });
            return null;
        }
        return user;
    },

    async updateProfile(userId: string, data: Partial<RegisterDTO>): Promise<IUser | null> {
        const updated = await User.findByIdAndUpdate(userId, data, { new: true });
        if (!updated) {
            await loggerService.log("Profile update failed: user not found", "warning", "auth", { userId });
            return null;
        }
        await loggerService.logInfo("User profile updated", { userId });
        return updated;
    },

    async deleteUser(userId: string): Promise<IUser | null> {
        const deleted = await User.findByIdAndDelete(userId);
        if (!deleted) {
            await loggerService.log("Delete user failed: user not found", "warning", "auth", { userId });
            return null;
        }
        await loggerService.logInfo("User account deleted", { userId });
        return deleted;
    },
};
