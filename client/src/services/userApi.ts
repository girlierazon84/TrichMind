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

/* ---------------------------------------------
    Corrected Base API Calls (match backend)
--------------------------------------------- */

// GET /api/users/profile
async function rawGetProfile() {
    const res = await axiosClient.get("/api/users/profile");
    return res.data;
}

// PATCH /api/users/profile
async function rawUpdateProfile(data: UpdateProfileData) {
    const res = await axiosClient.patch("/api/users/profile", data);
    return res.data;
}

// DELETE /api/users/delete   (backend added below)
async function rawDeleteAccount() {
    const res = await axiosClient.delete("/api/users/delete");
    return res.data;
}

/* ---------------------------------------------
    Wrapped API
--------------------------------------------- */
export const userApi = {
    getProfile: withLogging(rawGetProfile, {
        category: "auth",
        action: "getProfile",
        showToast: false,
    }),

    updateProfile: withLogging(rawUpdateProfile, {
        category: "auth",
        action: "updateProfile",
        showToast: true,
        successMessage: "Profile updated successfully!",
        errorMessage: "Failed to update your profile.",
    }),

    deleteAccount: withLogging(rawDeleteAccount, {
        category: "auth",
        action: "deleteAccount",
        showToast: true,
        successMessage: "Your account has been deleted.",
        errorMessage: "Failed to delete account.",
    }),
};

export default userApi;
