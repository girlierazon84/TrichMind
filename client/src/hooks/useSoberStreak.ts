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

/**
 * Backend may return either:
 *  - { ok: true, summary: { ... } }
 *  - { ...summaryFields }
 */
type ProgressSummaryApiResponse =
    | { ok: true; summary: unknown }
    | { ok?: boolean; summary?: unknown }
    | unknown;

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
    } catch {
        // ignore
    }
};

function toNumber(v: unknown, fallback = 0): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return fallback;
}

function toStringOrNull(v: unknown): string | null {
    return typeof v === "string" && v.trim() ? v : null;
}

function normalizeHistory(v: unknown): DailyHistoryItem[] {
    if (!Array.isArray(v)) return [];
    return v
        .map((row): DailyHistoryItem | null => {
            if (!row || typeof row !== "object") return null;
            const r = row as Record<string, unknown>;
            const day = typeof r.day === "string" ? r.day : null;
            const relapsed = typeof r.relapsed === "boolean" ? r.relapsed : null;
            if (!day || relapsed === null) return null;
            return { day, relapsed };
        })
        .filter((x): x is DailyHistoryItem => x !== null);
}

function pickSummary(payload: unknown): unknown {
    if (!payload || typeof payload !== "object") return payload;

    const obj = payload as Record<string, unknown>;
    // If backend wraps in { ok, summary }
    if ("summary" in obj) return obj.summary;
    return payload;
}

function normalize(payload: unknown): SoberStreakResponse {
    const base = pickSummary(payload);

    if (!base || typeof base !== "object") {
        return {
            currentStreak: 0,
            previousStreak: 0,
            longestStreak: 0,
            relapseCount: 0,
            lastEntryDate: null,
            lastRelapseDate: null,
            last14: [],
        };
    }

    const p = base as Record<string, unknown>;

    return {
        currentStreak: toNumber(p.currentStreak, 0),
        previousStreak: toNumber(p.previousStreak, 0),
        longestStreak: toNumber(p.longestStreak, 0),
        relapseCount: toNumber(p.relapseCount, 0),
        lastEntryDate: toStringOrNull(p.lastEntryDate),
        lastRelapseDate: toStringOrNull(p.lastRelapseDate),
        last14: normalizeHistory(p.last14),
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
            const res = await axiosClient.get<ProgressSummaryApiResponse>("/progress/daily/summary");
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
            } catch {
                // ignore
            }
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
