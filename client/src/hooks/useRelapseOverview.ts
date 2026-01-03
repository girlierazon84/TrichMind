// client/src/hooks/useRelapseOverview.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { relapseOverviewApi, type RelapseOverviewResponse } from "@/services";


/**-----------------------------------------------------------------
    Hook to manage fetching and refreshing relapse overview data
--------------------------------------------------------------------*/
export const useRelapseOverview = (enabled = true) => {
    // State variables to hold data, loading status, error messages, and last updated timestamp
    const [data, setData] = useState<RelapseOverviewResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(enabled);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Function to refresh the relapse overview data
    const refresh = useCallback(
        // Accepts an optional AbortSignal to handle cancellation
        async (signal?: AbortSignal) => {
            // If not enabled, exit early
            if (!enabled) return;

            // Fetch data from the API
            try {
                // Indicate loading state
                setLoading(true);
                const overview = await relapseOverviewApi.fetchOverview(signal);
                if (signal?.aborted) return;

                // Update state with fetched data
                setData(overview);
                setError(null);
                setLastUpdated(new Date());
            } catch (err: unknown) {
                // Handle errors gracefully
                if (signal?.aborted) return;
                console.error("[useRelapseOverview] failed", err);
                setError("We couldn’t refresh your relapse overview right now.");
            } finally {
                // Reset loading state
                if (!signal?.aborted) setLoading(false);
            }
        },
        [enabled]
    );

    // Effect to fetch data on mount or when 'enabled' changes
    useEffect(() => {
        // If not enabled, set loading to false and exit
        if (!enabled) {
            setLoading(false);
            return;
        }

        // Create an AbortController to manage fetch cancellation
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => controller.abort();
    }, [enabled, refresh]);

    return { data, loading, error, lastUpdated, refresh };
};

export default useRelapseOverview;
