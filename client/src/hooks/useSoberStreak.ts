// client/src/hooks/useSoberStreak.ts

import {
    useEffect,
    useState,
    useCallback
} from "react";
import { axiosClient } from "@/services";


// ──────────────────────────────
// Types
// ──────────────────────────────
// Sober streak API response structure
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

/** React hook to fetch user's sober streak data */
export const useSoberStreak = (): UseSoberStreakResult => {
    // State variables
    const [data, setData] = useState<SoberStreakResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch sober streak data
    const fetchStreak = useCallback(async () => {
        setLoading(true);
        setError(null);

        // 🔥 ALWAYS SHOW DEMO DATA IN DEV
        if (import.meta.env.DEV || window.location.search.includes("demo")) {
            setTimeout(() => {
                setData({
                    currentStreak: 12,
                    previousStreak: 8,
                    longestStreak: 25,
                    lastEntryDate: "2025-01-10"
                });
                setLoading(false);
            }, 300);
            return;
        }

        // Normal API call (production)
        try {
            const res = await axiosClient.get<SoberStreakResponse>("/api/health/streak");
            const payload = res.data || {};

            setData({
                currentStreak: payload.currentStreak ?? 0,
                previousStreak: payload.previousStreak ?? 0,
                longestStreak: payload.longestStreak,
                lastEntryDate: payload.lastEntryDate
            });
        } catch {
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
