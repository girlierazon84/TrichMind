// client/src/hooks/useSoberStreak.ts

import { useEffect, useState, useCallback, useRef } from "react";
import { axiosClient } from "@/services";


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
    refresh: () => Promise<void>;
}

export const useSoberStreak = (pollMs?: number): UseSoberStreakResult => {
    const [data, setData] = useState<SoberStreakResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<number | null>(null);

    const fetchStreak = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        const controller = new AbortController();

        try {
            const res = await axiosClient.get<SoberStreakResponse>(
                "/api/health/streak",
                {
                    signal: controller.signal,
                }
            );

            const payload = res.data || { currentStreak: 0 };
            setData({
                currentStreak: Number(payload.currentStreak ?? 0),
                previousStreak: payload.previousStreak ?? 0,
                longestStreak: payload.longestStreak ?? undefined,
                lastEntryDate: payload.lastEntryDate ?? undefined,
            });
        } catch (err) {
            const msg =
                (err as { message?: string })?.message ||
                "Failed to fetch streak data.";
            setError(msg);
        } finally {
            setLoading(false);
            controller.abort();
        }
    }, []);

    useEffect(() => {
        void fetchStreak();
        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
        };
    }, [fetchStreak]);

    useEffect(() => {
        if (!pollMs) return;

        pollRef.current = window.setInterval(() => {
            void fetchStreak();
        }, pollMs);

        return () => {
            if (pollRef.current) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [pollMs, fetchStreak]);

    return {
        data,
        loading,
        error,
        refresh: fetchStreak,
    };
};

export default useSoberStreak;
