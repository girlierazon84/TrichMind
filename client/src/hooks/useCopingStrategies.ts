// client/src/hooks/useCopingStrategies.ts

import { useState, useEffect, useCallback } from "react";

// LocalStorage keys
const STORAGE_WORKED = "tm_coping_worked";
const STORAGE_NOT_WORKED = "tm_coping_not_worked";

// Safely parse a JSON array from localStorage → always returns an array
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

export interface UseCopingStrategiesResult {
    worked: string[];
    notWorked: string[];
    setFromBackend: (worked?: string[] | null, notWorked?: string[] | null) => void;
    toggleStrategy: (name: string, bucket: CopingBucket) => void;
    reset: () => void;
}

/**---------------------------------------------------
  Central source of truth for coping strategies:
  • Hydrates from localStorage on mount
  • Can be updated from backend (/api/auth/me)
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
            console.log("[Coping] Hydrated from localStorage →", { worked: w, notWorked: n });
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
            console.log("[Coping] Persisted to localStorage →", {
                worked: nextWorked,
                notWorked: nextNotWorked,
            });
        } catch {
            // ignore storage errors
        }
    }, []);

    // STABLE: Update from backend data (never nukes existing arrays if backend is empty)
    const setFromBackend = useCallback(
        (backendWorked?: string[] | null, backendNotWorked?: string[] | null) => {
            setWorked((prevWorked) => {
                const w = Array.isArray(backendWorked)
                    ? backendWorked.map(String).filter(Boolean)
                    : prevWorked;

                setNotWorked((prevNotWorked) => {
                    const n = Array.isArray(backendNotWorked)
                        ? backendNotWorked.map(String).filter(Boolean)
                        : prevNotWorked;

                    persist(w, n);
                    return n;
                });

                return w;
            });
        },
        [persist],
    );

    // Toggle strategy in a bucket, using functional state updates
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

                    // Use latest notWorked when persisting
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

                    // Use latest worked when persisting
                    setWorked((prevWorked) => {
                        persist(prevWorked, nextNotWorked);
                        return prevWorked;
                    });

                    return nextNotWorked;
                });
            }
        },
        [persist],
    );

    // Reset: clear everything
    const reset = useCallback(() => {
        setWorked([]);
        setNotWorked([]);
        persist([], []);
    }, [persist]);

    return {
        worked,
        notWorked,
        setFromBackend,
        toggleStrategy,
        reset
    };
};

export default useCopingStrategies;
