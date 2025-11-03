// server/src/services/userService.ts

import { User, IUser } from "../models/UserModel";
import { RegisterDTO, LoginDTO } from "../schemas/userSchema";
import { loggerService } from "./loggerService";


/**------------------------------------------------------------------
💡 User Service
Handles user registration, login, profile management, and deletion.
---------------------------------------------------------------------**/
export const userService = {
    // 🆕 Register a new user
    async register(data: RegisterDTO): Promise<IUser> {
        // Check if the email is already registered
        const existing = await User.findOne({ email: data.email.toLowerCase() });
        if (existing) throw new Error("Email already registered");

        // Create and save the new user
        const user = await User.create({
            ...data,
            email: data.email.toLowerCase(),
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
        });

        // Log the registration event
        await loggerService.logInfo("New user registered", { userId: user._id, email: user.email });
        return user;
    },

    // 🔐 User login
    async login(data: LoginDTO): Promise<IUser> {
        // Validate input data
        const user = await User.findOne({ email: data.email.toLowerCase() });
        if (!user) {
            await loggerService.log("Login attempt with invalid email", "warning", "auth", { email: data.email });
            throw new Error("Invalid email or password");
        }

        // Check if the password is valid
        const valid = await user.compare(data.password);
        if (!valid) {
            await loggerService.log("Invalid password attempt", "warning", "auth", { email: data.email });
            throw new Error("Invalid email or password");
        }

        // Log the successful login
        await loggerService.logInfo("User logged in", { userId: user._id, email: user.email });
        return user;
    },

    // 🔍 Get user by ID
    async getById(id: string): Promise<IUser | null> {
        // Validate input
        const user = await User.findById(id);
        if (!user) {
            // Log user not found
            await loggerService.log("User not found", "warning", "auth", { userId: id });
            return null;
        }
        // Log user found
        return user;
    },

    // 🔍 Find user by email
    async findByEmail(email: string): Promise<IUser | null> {
        // Validate input
        const user = await User.findOne({ email: email.toLowerCase() });
        // Log if user not found
        if (!user) {
            await loggerService.log("User not found by email", "warning", "auth", { email });
            return null;
        }
        // Log user found
        return user;
    },

    // ✏️ Update user profile
    async updateProfile(userId: string, data: Partial<RegisterDTO>): Promise<IUser | null> {
        // Validate input
        const updated = await User.findByIdAndUpdate(userId, data, { new: true });
        // Log if user not found
        if (!updated) {
            await loggerService.log("Profile update failed: user not found", "warning", "auth", { userId });
            return null;
        }
        // Log successful profile update
        await loggerService.logInfo("User profile updated", { userId });
        return updated;
    },

    // ❌ Delete user account
    async deleteUser(userId: string): Promise<IUser | null> {
        // Validate input
        const deleted = await User.findByIdAndDelete(userId);
        // Log if user not found
        if (!deleted) {
            await loggerService.log("Delete user failed: user not found", "warning", "auth", { userId });
            return null;
        }
        // Log successful deletion
        await loggerService.logInfo("User account deleted", { userId });
        return deleted;
    },
};
