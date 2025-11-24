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
    • Hydrates from localStorage on mount
    • Can be updated from backend (/api/auth/me)
    • Persists all changes back to localStorage
------------------------------------------------------*/
export const useCopingStrategies = (): UseCopingStrategiesResult => {
    const [worked, setWorked] = useState<string[]>([]);
    const [notWorked, setNotWorked] = useState<string[]>([]);

    // Initial hydrate from localStorage (no defaults, just user data)
    useEffect(() => {
        try {
            const w = safeParseArray(
                localStorage.getItem(STORAGE_WORKED),
                []
            );
            const n = safeParseArray(
                localStorage.getItem(STORAGE_NOT_WORKED),
                []
            );
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

    // Update from backend data (no defaults injected)
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

                    // Persist both together
                    persist(w, n);
                    return n;
                });

                return w;
            });
        },
        [persist]
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
        [persist]
    );

    // Reset: just clear the user's strategies
    const reset = useCallback(() => {
        const w: string[] = [];
        const n: string[] = [];
        setWorked(w);
        setNotWorked(n);
        persist(w, n);
    }, [persist]);

    return { worked, notWorked, setFromBackend, toggleStrategy, reset };
};

export default useCopingStrategies;
