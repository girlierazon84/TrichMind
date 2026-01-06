// client/src/hooks/useSoberStreak.ts

"use client";

import { useEffect, useState, useCallback } from "react";
import { axiosClient } from "@/services";

export type DailyHistoryItem = { day: string; relapsed: boolean };

// New response shape (backwards-compatible fields kept)
export interface SoberStreakResponse {
    currentStreak: number;
    previousStreak?: number;
    longestStreak?: number;
    relapseCount?: number;
    lastEntryDate?: string | null;
    lastRelapseDate?: string | null;
    last14?: DailyHistoryItem[];
}

interface UseSoberStreakResult {
    data: SoberStreakResponse | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    checkIn: (relapsed: boolean, opts?: { date?: string; note?: string }) => Promise<void>;
}

const LOCAL_KEY = "tm_sober_streak";

const safeLSGet = (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

const safeLSSet = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch { }
};

function normalize(payload: any): SoberStreakResponse {
    return {
        currentStreak: typeof payload?.currentStreak === "number" ? payload.currentStreak : 0,
        previousStreak: typeof payload?.previousStreak === "number" ? payload.previousStreak : 0,
        longestStreak: typeof payload?.longestStreak === "number" ? payload.longestStreak : 0,
        relapseCount: typeof payload?.relapseCount === "number" ? payload.relapseCount : 0,
        lastEntryDate: payload?.lastEntryDate ?? null,
        lastRelapseDate: payload?.lastRelapseDate ?? null,
        last14: Array.isArray(payload?.last14) ? payload.last14 : [],
    };
}

export const useSoberStreak = (): UseSoberStreakResult => {
    const [data, setData] = useState<SoberStreakResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStreak = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await axiosClient.get("/progress/daily/summary");
            const normalized = normalize(res.data);

            setData(normalized);
            safeLSSet(LOCAL_KEY, JSON.stringify(normalized));
        } catch {
            try {
                const stored = safeLSGet(LOCAL_KEY);
                if (stored) {
                    setData(JSON.parse(stored) as SoberStreakResponse);
                    return;
                }
            } catch { }
            setError("Failed to fetch progress data.");
        } finally {
            setLoading(false);
        }
    }, []);

    const checkIn = useCallback(
        async (relapsed: boolean, opts?: { date?: string; note?: string }) => {
            setError(null);
            await axiosClient.post("/progress/daily/checkin", { relapsed, ...opts });
            await fetchStreak();
        },
        [fetchStreak]
    );

    useEffect(() => {
        void fetchStreak();
    }, [fetchStreak]);

    return { data, loading, error, refetch: fetchStreak, checkIn };
};

export default useSoberStreak;
