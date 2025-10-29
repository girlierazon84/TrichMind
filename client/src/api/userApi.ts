// client/src/api/userApi.ts
import { axiosClient } from "./axiosClient";

export interface UpdateProfileData {
    displayName?: string;
    date_of_birth?: string;
    age?: number;
    emotion?: string;
    pulling_severity?: number;
}

export const userApi = {
    /** 👤 Get user profile */
    getProfile: async () => {
        const res = await axiosClient.get("/users/me");
        return res.data;
    },

    /** ✏️ Update user profile */
    updateProfile: async (data: UpdateProfileData) => {
        const res = await axiosClient.put("/users/update", data);
        return res.data;
    },

    /** 🗑️ Delete user account */
    deleteAccount: async () => {
        const res = await axiosClient.delete("/users/delete");
        return res.data;
    },
};
