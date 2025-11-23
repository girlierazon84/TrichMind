// client/src/hooks/useCopingStrategies.ts

import { useState, useEffect, useCallback } from "react";

// LocalStorage keys
const STORAGE_WORKED = "tm_coping_worked";
const STORAGE_NOT_WORKED = "tm_coping_not_worked";

// Safely parse a JSON array from localStorage, with fallback
const safeParseArray = (raw: string | null, fallback: string[]): string[] => {
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.map(String).filter(Boolean);
        }
        return fallback;
    } catch {
        return fallback;
    }
};

// Types
export type CopingBucket = "worked" | "notWorked";

// Hook return type
export interface UseCopingStrategiesResult {
    worked: string[];
    notWorked: string[];
    setFromBackend: (worked?: string[] | null, notWorked?: string[] | null) => void;
    toggleStrategy: (name: string, bucket: CopingBucket) => void;
    reset: () => void;
}

/**---------------------------------------------------
    Central source of truth for coping strategies:
    Hydrates from localStorage on mount
    Can be updated from backend (/api/auth/me)
    Persists all changes back to localStorage
------------------------------------------------------*/
export const useCopingStrategies = (): UseCopingStrategiesResult => {
    const [worked, setWorked] = useState<string[]>([]);
    const [notWorked, setNotWorked] = useState<string[]>([]);

    // Initial hydrate from localStorage
    useEffect(() => {
        try {
            // Load from localStorage
            const w = safeParseArray(localStorage.getItem(STORAGE_WORKED), ["Fidget toy"]);
            const n = safeParseArray(localStorage.getItem(STORAGE_NOT_WORKED), ["Journaling"]);
            setWorked(w);
            setNotWorked(n);
        } catch {
            setWorked(["Fidget toy"]);
            setNotWorked(["Journaling"]);
        }
    }, []);

    // Persist to localStorage helper
    const persist = (nextWorked: string[], nextNotWorked: string[]) => {
        try {
            localStorage.setItem(STORAGE_WORKED, JSON.stringify(nextWorked));
            localStorage.setItem(STORAGE_NOT_WORKED, JSON.stringify(nextNotWorked));
        } catch {
            // ignore storage errors
        }
    };

    // Update from backend data
    const setFromBackend = useCallback(
        (backendWorked?: string[] | null, backendNotWorked?: string[] | null) => {
            const w = Array.isArray(backendWorked)
                ? backendWorked.map(String).filter(Boolean)
                : worked;
            const n = Array.isArray(backendNotWorked)
                ? backendNotWorked.map(String).filter(Boolean)
                : notWorked;

            setWorked(w);
            setNotWorked(n);
            persist(w, n);
        },
        [worked, notWorked]
    );

    // Toggle strategy in a bucket
    const toggleStrategy = useCallback(
        (name: string, bucket: CopingBucket) => {
            const trimmed = name.trim();
            if (!trimmed) return;

            if (bucket === "worked") {
                setWorked((prev) => {
                    const exists = prev.includes(trimmed);
                    const next = exists
                        ? prev.filter((n) => n !== trimmed)
                        : [...prev, trimmed];
                    persist(next, notWorked);
                    return next;
                });
            } else {
                setNotWorked((prev) => {
                    const exists = prev.includes(trimmed);
                    const next = exists
                        ? prev.filter((n) => n !== trimmed)
                        : [...prev, trimmed];
                    persist(worked, next);
                    return next;
                });
            }
        },
        [worked, notWorked]
    );

    // Reset to default strategies
    const reset = useCallback(() => {
        const w = ["Fidget toy"];
        const n = ["Journaling"];
        setWorked(w);
        setNotWorked(n);
        persist(w, n);
    }, []);

    return { worked, notWorked, setFromBackend, toggleStrategy, reset };
};

export default useCopingStrategies;
