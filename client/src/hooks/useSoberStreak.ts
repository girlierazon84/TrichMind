// client/src/hooks/useSoberStreak.ts
"use client";

import {
    useEffect,
    useState,
    useCallback
} from "react";
import { axiosClient } from "@/services";


// Response structure for sober streak data
export interface SoberStreakResponse {
    currentStreak: number;
    previousStreak?: number;
    longestStreak?: number;
    lastEntryDate?: string;
}

// Hook return type
interface UseSoberStreakResult {
    data: SoberStreakResponse | null;
    loading: boolean;
    error: string | null;
}

// Local storage key for caching streak data
const LOCAL_KEY = "tm_sober_streak";

// Safe localStorage get/set to avoid SSR issues
const safeLSGet = (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

// Safe localStorage set to avoid SSR issues
const safeLSSet = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch { }
};

// Hook to fetch and manage sober streak data from the server with localStorage fallback
export const useSoberStreak = (): UseSoberStreakResult => {
    // State management for data, loading, and error states
    const [data, setData] = useState<SoberStreakResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch streak data from the server with localStorage fallback
    const fetchStreak = useCallback(async () => {
        // Start loading and reset error state
        setLoading(true);
        setError(null);

        // Attempt to fetch data from the server first
        try {
            // Fetch streak data from the API endpoint
            const res = await axiosClient.get<SoberStreakResponse>("/health/streak");
            const payload = res.data || {};

            // Normalize the response data to ensure all fields are present and valid
            const normalized: SoberStreakResponse = {
                currentStreak: payload.currentStreak ?? 0,
                previousStreak: payload.previousStreak ?? 0,
                longestStreak: payload.longestStreak,
                lastEntryDate: payload.lastEntryDate,
            };

            // Update state and cache the normalized data in localStorage
            setData(normalized);
            safeLSSet(LOCAL_KEY, JSON.stringify(normalized));
        } catch {
            // fallback to localStorage
            try {
                // Try to retrieve cached data from localStorage if the API call fails
                const stored = safeLSGet(LOCAL_KEY);
                if (stored) {
                    // Parse and set the cached data if available
                    const parsed = JSON.parse(stored) as SoberStreakResponse;
                    setData(parsed);
                    return;
                }
            } catch { }

            // Set error state if both API call and localStorage retrieval fail
            setError("Failed to fetch streak data.");
        } finally {
            // End loading state regardless of success or failure
            setLoading(false);
        }
    }, []);

    // Fetch streak data on initial hook usage and whenever fetchStreak changes
    useEffect(() => {
        void fetchStreak();
    }, [fetchStreak]);

    return { data, loading, error };
};

export default useSoberStreak;
