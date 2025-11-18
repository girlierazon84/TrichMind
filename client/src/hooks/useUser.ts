// client/src/hooks/useUser.ts

import { useState } from "react";
import { toast } from "react-toastify";
import { userApi, type UpdateProfileData } from "@/services";
import { useLogger, useAuth } from "@/hooks";

// ─────────────────────────────────────
// Hook to manage User operations
// ─────────────────────────────────────
export const useUser = () => {
    // Loading state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // User and refresh function from auth context
    const { user, refreshUser } = useAuth(); // now exists in useAuth()
    const { log, error: logError } = useLogger(false);

    // Fetch user profile
    const getProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await userApi.getProfile();
            await log("Fetched user profile", { user: data?.email ?? "unknown" });
            return data;
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to load profile";
            setError(msg);
            await logError("User profile fetch failed", { error: msg });
            toast.error(msg);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    // Update user profile
    const updateProfile = async (data: UpdateProfileData) => {
        setLoading(true);
        setError(null);
        try {
            const updated = await userApi.updateProfile(data);
            await log("User profile updated", { fields: Object.keys(data) });

            // Refresh global user object
            await refreshUser();

            toast.success("Profile updated successfully!");
            return updated;
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to update profile";
            setError(msg);
            await logError("Profile update failed", { error: msg, data });
            toast.error(msg);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    // Delete user account
    const deleteAccount = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await userApi.deleteAccount();
            await log("User account deleted", { id: user?.id ?? "unknown" });
            toast.info("Your account has been deleted.");
            return res;
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to delete account";
            setError(msg);
            await logError("Account deletion failed", { error: msg });
            toast.error(msg);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        getProfile,
        updateProfile,
        deleteAccount,
        loading,
        error,
    };
};

export default useUser;
