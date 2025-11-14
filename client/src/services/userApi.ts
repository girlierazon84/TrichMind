// client/src/services/userApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


export interface UpdateProfileData {
    displayName?: string;
    date_of_birth?: string;
    age?: number;
    emotion?: string;
    pulling_severity?: number;
}

/**
 * 👤 User API — manages profile retrieval, updates, and account deletion.
 * Automatically wrapped with logging and toast feedback.
 */

// ──────────────── Base API calls ────────────────

async function rawGetProfile() {
    const res = await axiosClient.get("/api/users/profile");
    return res.data;
}

async function rawUpdateProfile(data: UpdateProfileData) {
    const res = await axiosClient.put("/api/users/profile", data);
    return res.data;
}

async function rawDeleteAccount() {
    const res = await axiosClient.delete("/api/users/delete");
    return res.data;
}

// ──────────────── Wrapped API with Logging ────────────────

export const userApi = {
    /** 👤 Get current user profile */
    getProfile: withLogging(rawGetProfile, {
        category: "auth",
        action: "getProfile",
        showToast: false,
    }),

    /** ✏️ Update user profile */
    updateProfile: withLogging(rawUpdateProfile, {
        category: "auth",
        action: "updateProfile",
        showToast: true,
        successMessage: "Profile updated successfully!",
        errorMessage: "Failed to update your profile.",
    }),

    /** 🗑️ Delete user account */
    deleteAccount: withLogging(rawDeleteAccount, {
        category: "auth",
        action: "deleteAccount",
        showToast: true,
        successMessage: "Your account has been deleted.",
        errorMessage: "Failed to delete account.",
    }),
};
