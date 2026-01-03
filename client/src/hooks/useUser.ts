// client/src/hooks/useUser.ts
"use client";

import { useState } from "react";
import {
    userApi,
    type UpdateProfileData
} from "@/services";
import { useLogger, useAuth } from "@/hooks";


/**---------------------------------------------------
    Custom hook to manage user profile operations.
------------------------------------------------------*/
export const useUser = () => {
    // State for loading and error handling
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get user and logging functions from custom hooks
    const { user, refreshUser } = useAuth();
    const { log, error: logError } = useLogger(false);

    // Fetch user profile
    const getProfile = async () => {
        // Reset state
        setLoading(true);
        setError(null);
        try {
            // Call API to get user profile
            const data = await userApi.getProfile();
            if (data.ok) {
                void log("Fetched user profile", { email: data.user?.email ?? "unknown" });
            } else {
                void logError("User profile fetch failed", { error: data.error, details: data.details });
            }
            return data;
        } catch (e: unknown) {
            // Handle errors
            const msg = e instanceof Error ? e.message : "Failed to load profile";
            setError(msg);
            void logError("User profile fetch failed", { error: msg });
            throw e;
        } finally {
            // Reset loading state
            setLoading(false);
        }
    };

    // Update user profile
    const updateProfile = async (data: UpdateProfileData) => {
        // Reset state
        setLoading(true);
        setError(null);
        try {
            // Call API to update user profile
            const updated = await userApi.updateProfile(data);
            if (updated.ok) {
                // Log success and refresh user data
                void log("User profile updated", { fields: Object.keys(data) });
                await refreshUser();
            } else {
                // Log failure
                void logError("Profile update failed", { error: updated.error, details: updated.details });
            }
            return updated;
        } catch (e: unknown) {
            // Handle errors
            const msg = e instanceof Error ? e.message : "Failed to update profile";
            setError(msg);
            void logError("Profile update failed", { error: msg, data });
            throw e;
        } finally {
            // Reset loading state
            setLoading(false);
        }
    };

    // Delete user account
    const deleteAccount = async () => {
        // Reset state
        setLoading(true);
        setError(null);
        try {
            // Call API to delete user account
            const res = await userApi.deleteAccount();
            void log("User account delete requested", { id: user?.id ?? "unknown", ok: res.ok });
            return res;
        } catch (e: unknown) {
            // Handle errors
            const msg = e instanceof Error ? e.message : "Failed to delete account";
            setError(msg);
            void logError("Account deletion failed", { error: msg });
            throw e;
        } finally {
            // Reset loading state
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
