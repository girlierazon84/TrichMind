// client/src/services/userApi.ts
"use client";

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**------------------------------------------------
    Types and Interfaces for User API Endpoints
---------------------------------------------------*/
// Data used to update the user profile
export interface UpdateProfileData {
    displayName?: string;

    age?: number;
    age_of_onset?: number;
    years_since_onset?: number;

    pulling_severity?: number;
    pulling_frequency?: string;
    pulling_awareness?: string;

    successfully_stopped?: string | boolean;
    how_long_stopped_days?: number;

    emotion?: string;
    avatarUrl?: string;

    coping_worked?: string | string[];
    coping_not_worked?: string | string[];
}

// User profile structure returned by the API
export interface UserProfile {
    id: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;

    age?: number;
    age_of_onset?: number;
    years_since_onset?: number;

    pulling_severity?: number;
    pulling_frequency?: string;
    pulling_awareness?: string;

    successfully_stopped?: string | boolean;
    successfully_stopped_encoded?: boolean;

    how_long_stopped_days?: number;
    how_long_stopped_days_est?: number;

    emotion?: string;

    coping_worked?: string[];
    coping_not_worked?: string[];

    // allow extra fields without breaking:
    [key: string]: unknown;
}

// Response types for the API calls
export type GetProfileResponse =
    | { ok: true; user: UserProfile }
    | { ok: false; error: string; message?: string; details?: unknown };

// Response types for the API calls
export type UpdateProfileResponse =
    | { ok: true; user: UserProfile }
    | { ok: false; error: string; message?: string; details?: unknown };

// Response type for deleting the user account
export type DeleteAccountResponse =
    | { ok: true; message?: string }
    | { ok: false; error: string; message?: string; details?: unknown };

// Base path for user-related API endpoints
const USERS_BASE = "/users";

/**------------------
    Raw API Calls
---------------------*/
// Fetch the user profile from the server
async function rawGetProfile(): Promise<GetProfileResponse> {
    // Make a GET request to the profile endpoint
    const res = await axiosClient.get<GetProfileResponse>(`${USERS_BASE}/profile`);
    return res.data;
}

// Update the user profile on the server
async function rawUpdateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    // Make a PATCH request to the profile endpoint with the provided data
    const res = await axiosClient.patch<UpdateProfileResponse>(`${USERS_BASE}/profile`, data);
    return res.data;
}

// Fetch the latest health data for the user
async function rawGetLatestHealth() {
    // Make a GET request to the latest health endpoint
    const res = await axiosClient.get(`${USERS_BASE}/health/latest`);
    return res.data;
}

// Delete the user account from the server
async function rawDeleteAccount(): Promise<DeleteAccountResponse> {
    // Make a DELETE request to the delete account endpoint
    const res = await axiosClient.delete<DeleteAccountResponse>(`${USERS_BASE}/delete`);
    return res.data;
}

// Exported user API with logging
export const userApi = {
    getProfile: withLogging(rawGetProfile, {
        category: "auth",
        action: "users_getProfile",
    }),
    updateProfile: withLogging(rawUpdateProfile, {
        category: "auth",
        action: "users_updateProfile",
    }),
    getLatestHealth: withLogging(rawGetLatestHealth, {
        category: "ui",
        action: "users_getLatestHealth",
    }),
    deleteAccount: withLogging(rawDeleteAccount, {
        category: "auth",
        action: "users_deleteAccount",
    }),
};

export default userApi;
