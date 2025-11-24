// client/src/hooks/useCopingStrategies.ts

import { useState, useEffect, useCallback } from "react";

// LocalStorage keys
const STORAGE_WORKED = "tm_coping_worked";
const STORAGE_NOT_WORKED = "tm_coping_not_worked";

// Safely parse a JSON array from localStorage, with fallback = []
const safeParseArray = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.map(String).filter(Boolean);
        }
        return [];
    } catch {
        return [];
    }
};

// Types
export type CopingBucket = "worked" | "notWorked";

// Hook return type
export interface UseCopingStrategiesResult {
    worked: string[];
    notWorked: string[];
    /**
     * Used when you *really* want to replace with a source of truth
     * (e.g. when backend returns non-empty arrays, or from Profile form).
     */
    setFromBackend: (worked?: string[] | null, notWorked?: string[] | null) => void;
    toggleStrategy: (name: string, bucket: CopingBucket) => void;
    reset: () => void;
}

/**---------------------------------------------------
    Central source of truth for coping strategies:
    • Hydrates from localStorage on mount
    • Can be updated from backend/profile (setFromBackend)
    • Persists all changes back to localStorage
------------------------------------------------------*/
export const useCopingStrategies = (): UseCopingStrategiesResult => {
    const [worked, setWorked] = useState<string[]>([]);
    const [notWorked, setNotWorked] = useState<string[]>([]);

    // Initial hydrate from localStorage
    useEffect(() => {
        try {
            const w = safeParseArray(localStorage.getItem(STORAGE_WORKED));
            const n = safeParseArray(localStorage.getItem(STORAGE_NOT_WORKED));
            setWorked(w);
            setNotWorked(n);
        } catch {
            setWorked([]);
            setNotWorked([]);
        }
    }, []);

    // Persist to localStorage helper (stable)
    const persist = useCallback((nextWorked: string[], nextNotWorked: string[]) => {
        try {
            localStorage.setItem(STORAGE_WORKED, JSON.stringify(nextWorked));
            localStorage.setItem(STORAGE_NOT_WORKED, JSON.stringify(nextNotWorked));
        } catch {
            // ignore storage errors
        }
    }, []);

    // ✅ Only override from backend when it actually has NON-EMPTY arrays
    const setFromBackend = useCallback(
        (backendWorked?: string[] | null, backendNotWorked?: string[] | null) => {
            setWorked((prevWorked) => {
                const normalizedBackendWorked = Array.isArray(backendWorked)
                    ? backendWorked.map(String).filter(Boolean)
                    : [];

                const nextWorked =
                    normalizedBackendWorked.length > 0 ? normalizedBackendWorked : prevWorked;

                setNotWorked((prevNotWorked) => {
                    const normalizedBackendNotWorked = Array.isArray(backendNotWorked)
                        ? backendNotWorked.map(String).filter(Boolean)
                        : [];

                    const nextNotWorked =
                        normalizedBackendNotWorked.length > 0
                            ? normalizedBackendNotWorked
                            : prevNotWorked;

                    // Persist both together
                    persist(nextWorked, nextNotWorked);
                    return nextNotWorked;
                });

                return nextWorked;
            });
        },
        [persist]
    );

    // Toggle strategy in a bucket (and persist)
    const toggleStrategy = useCallback(
        (name: string, bucket: CopingBucket) => {
            const trimmed = name.trim();
            if (!trimmed) return;

            if (bucket === "worked") {
                setWorked((prevWorked) => {
                    const exists = prevWorked.includes(trimmed);
                    const nextWorked = exists
                        ? prevWorked.filter((n) => n !== trimmed)
                        : [...prevWorked, trimmed];

                    // Persist using latest notWorked
                    setNotWorked((prevNotWorked) => {
                        persist(nextWorked, prevNotWorked);
                        return prevNotWorked;
                    });

                    return nextWorked;
                });
            } else {
                setNotWorked((prevNotWorked) => {
                    const exists = prevNotWorked.includes(trimmed);
                    const nextNotWorked = exists
                        ? prevNotWorked.filter((n) => n !== trimmed)
                        : [...prevNotWorked, trimmed];

                    // Persist using latest worked
                    setWorked((prevWorked) => {
                        persist(prevWorked, nextNotWorked);
                        return prevWorked;
                    });

                    return nextNotWorked;
                });
            }
        },
        [persist]
    );

    // Reset everything
    const reset = useCallback(() => {
        setWorked([]);
        setNotWorked([]);
        persist([], []);
    }, [persist]);

    return { worked, notWorked, setFromBackend, toggleStrategy, reset };
};

export default useCopingStrategies;
