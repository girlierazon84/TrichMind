// client/src/hooks/useRelapseOverview.ts

import {
    useCallback,
    useEffect,
    useState
} from "react";
import {
    relapseOverviewApi,
    type RelapseOverviewResponse,
} from "@/services";


/**----------------------------------------------------
    Hook to fetch and manage relapse overview data.
-------------------------------------------------------*/
export const useRelapseOverview = () => {
    const [data, setData] = useState<RelapseOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Function to refresh the relapse overview data
    const refresh = useCallback(
        async (signal?: AbortSignal) => {
            try {
                setLoading(true);
                const overview = await relapseOverviewApi.fetchOverview(signal);
                setData(overview);
                setError(null);
                setLastUpdated(new Date());
            } catch (err: unknown) {
                if (signal?.aborted) return;
                // keep console noise but type-safe
                console.error("[useRelapseOverview] failed", err);
                setError(
                    "We couldn’t refresh your relapse overview right now."
                );
            } finally {
                if (!signal?.aborted) {
                    setLoading(false);
                }
            }
        },
        []
    );

    // Initial data fetch on mount
    useEffect(() => {
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => controller.abort();
    }, [refresh]);

    return { data, loading, error, lastUpdated, refresh };
};
