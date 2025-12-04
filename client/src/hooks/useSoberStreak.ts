// client/src/hooks/useSoberStreak.ts

import {
    useEffect,
    useState,
    useCallback
} from "react";
import { axiosClient } from "@/services";


/**----------
    Types
-------------*/
export interface SoberStreakResponse {
    currentStreak: number;
    previousStreak?: number;
    longestStreak?: number;
    lastEntryDate?: string;
}

/**-----------------------------------------------
    Result returned by the useSoberStreak hook
--------------------------------------------------*/
interface UseSoberStreakResult {
    data: SoberStreakResponse | null;
    loading: boolean;
    error: string | null;
}

// Local storage key for caching sober streak data
const LOCAL_KEY = "tm_sober_streak";

/**-------------------------------------------------
    React hook to fetch user's sober streak data
----------------------------------------------------*/
export const useSoberStreak = (): UseSoberStreakResult => {
    const [data, setData] = useState<SoberStreakResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch sober streak data from backend or localStorage
    const fetchStreak = useCallback(async () => {
        setLoading(true);
        setError(null);

        // 1) Try to fetch from backend
        try {
            // ❗ Remove /api prefix
            const res = await axiosClient.get<SoberStreakResponse>("/health/streak");
            const payload = res.data || {};

            // Normalize the response to ensure all fields are present
            const normalized: SoberStreakResponse = {
                currentStreak: payload.currentStreak ?? 0,
                previousStreak: payload.previousStreak ?? 0,
                longestStreak: payload.longestStreak,
                lastEntryDate: payload.lastEntryDate,
            };

            // Update state with normalized data
            setData(normalized);

            // Cache to localStorage as a fallback for next time
            try {
                localStorage.setItem(LOCAL_KEY, JSON.stringify(normalized));
            } catch {
                // ignore storage issues
            }
        } catch {
            // 2) Fallback to localStorage (seeded from registration)
            try {
                const stored = localStorage.getItem(LOCAL_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored) as SoberStreakResponse;
                    setData(parsed);
                    return;
                }
            } catch {
                // ignore JSON errors
            }

            setError("Failed to fetch streak data.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch streak data on mount
    useEffect(() => {
        fetchStreak();
    }, [fetchStreak]);

    return { data, loading, error };
};

export default useSoberStreak;
