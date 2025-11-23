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

interface UseSoberStreakResult {
    data: SoberStreakResponse | null;
    loading: boolean;
    error: string | null;
}

const LOCAL_KEY = "tm_sober_streak";

/**-------------------------------------------------
    React hook to fetch user's sober streak data
----------------------------------------------------*/
export const useSoberStreak = (): UseSoberStreakResult => {
    const [data, setData] = useState<SoberStreakResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStreak = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // 1) Try real backend API
            const res = await axiosClient.get<SoberStreakResponse>("/api/health/streak");
            const payload = res.data || {};

            const normalized: SoberStreakResponse = {
                currentStreak: payload.currentStreak ?? 0,
                previousStreak: payload.previousStreak ?? 0,
                longestStreak: payload.longestStreak,
                lastEntryDate: payload.lastEntryDate,
            };

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

    useEffect(() => {
        fetchStreak();
    }, [fetchStreak]);

    return { data, loading, error };
};

export default useSoberStreak;
