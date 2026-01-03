// client/src/hooks/useCopingStrategies.ts
"use client";

import { useCallback, useMemo, useState } from "react";


/**---------------------------------------------------------------------
    Custom hook to manage coping strategies.
    Stores strategies that have worked / not worked in localStorage.
    ✅ No setState in useEffect (avoids cascading renders warning)
------------------------------------------------------------------------*/

// LocalStorage keys
const STORAGE_WORKED = "tm_coping_worked";
const STORAGE_NOT_WORKED = "tm_coping_not_worked";

/**----------------------------------
    SSR-safe localStorage helpers
-------------------------------------*/
function safeLSGet(key: string): string | null {
    // SSR-safe check
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

// SSR-safe setter
function safeLSSet(key: string, value: string) {
    // SSR-safe check
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // ignore
    }
}

/**--------------------
    Parsing helpers
-----------------------*/
function safeParseArray(raw: string | null): string[] {
    // Return empty array if null/invalid
    if (!raw) return [];
    // Attempt to parse
    try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {
        return [];
    }
}

/**----------
    Types
-------------*/
export type CopingBucket = "worked" | "notWorked";

// Result interface
export interface UseCopingStrategiesResult {
    // Current arrays
    worked: string[];
    notWorked: string[];
    setFromBackend: (worked?: string[] | null, notWorked?: string[] | null) => void;
    toggleStrategy: (name: string, bucket: CopingBucket) => void;
    reset: () => void;
}

/**---------
    Hook
------------*/
export const useCopingStrategies = (): UseCopingStrategiesResult => {
    //✅ Hydrate from localStorage in the initializer (client-only, SSR-safe check inside safeLSGet)
    const initial = useMemo(() => {
        // Parse both arrays
        const w = safeParseArray(safeLSGet(STORAGE_WORKED));
        const n = safeParseArray(safeLSGet(STORAGE_NOT_WORKED));
        return { w, n };
    }, []);

    // State for both buckets
    const [worked, setWorked] = useState<string[]>(initial.w);
    const [notWorked, setNotWorked] = useState<string[]>(initial.n);

    // Persist both buckets
    const persist = useCallback((nextWorked: string[], nextNotWorked: string[]) => {
        // Save to localStorage
        safeLSSet(STORAGE_WORKED, JSON.stringify(nextWorked));
        safeLSSet(STORAGE_NOT_WORKED, JSON.stringify(nextNotWorked));
    }, []);

    //✅ Only override from backend if backend arrays are NON-EMPTY
    // - If backend sends empty arrays, we keep current local state.
    const setFromBackend = useCallback(
        // Set both buckets from backend data
        (backendWorked?: string[] | null, backendNotWorked?: string[] | null) => {
            // Parse backend arrays safely
            const bw = Array.isArray(backendWorked)
                ? backendWorked.map(String).map((s) => s.trim()).filter(Boolean)
                : [];

            // Parse backend arrays safely
            const bn = Array.isArray(backendNotWorked)
                ? backendNotWorked.map(String).map((s) => s.trim()).filter(Boolean)
                : [];

            // Update state conditionally
            setWorked((prevW) => {
                // Use backend array if non-empty, else keep previous
                const nextW = bw.length > 0 ? bw : prevW;

                // Persist with latest notWorked
                setNotWorked((prevN) => {
                    const nextN = bn.length > 0 ? bn : prevN;
                    persist(nextW, nextN);
                    return nextN;
                });

                return nextW;
            });
        },
        [persist]
    );

    // Toggle strategy in a bucket
    const toggleStrategy = useCallback(
        // Toggle a strategy in the specified bucket
        (name: string, bucket: CopingBucket) => {
            // Trim name and ignore empty
            const trimmed = name.trim();
            if (!trimmed) return;

            // Update the appropriate bucket
            if (bucket === "worked") {
                // Update worked bucket
                setWorked((prevW) => {
                    const exists = prevW.includes(trimmed);
                    const nextW = exists ? prevW.filter((s) => s !== trimmed) : [...prevW, trimmed];

                    // persist with latest notWorked
                    setNotWorked((prevN) => {
                        persist(nextW, prevN);
                        return prevN;
                    });

                    return nextW;
                });
            } else {
                // Update notWorked bucket
                setNotWorked((prevN) => {
                    // Check existence
                    const exists = prevN.includes(trimmed);
                    const nextN = exists ? prevN.filter((s) => s !== trimmed) : [...prevN, trimmed];

                    // persist with latest worked
                    setWorked((prevW) => {
                        persist(prevW, nextN);
                        return prevW;
                    });

                    return nextN;
                });
            }
        },
        [persist]
    );

    // Reset everything
    const reset = useCallback(() => {
        // Clear both buckets
        setWorked([]);
        setNotWorked([]);
        persist([], []);
    }, [persist]);

    return { worked, notWorked, setFromBackend, toggleStrategy, reset };
};

export default useCopingStrategies;
