// client/src/hooks/useRelapseOverview.ts

import { useEffect, useState } from "react";
import {
    relapseOverviewApi,
    type RelapseOverviewResponse,
} from "@/services/relapseOverviewApi";

export const useRelapseOverview = () => {
    const [data, setData] = useState<RelapseOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        const controller = new AbortController();

        (async () => {
            try {
                setLoading(true);
                const result = await relapseOverviewApi.fetchOverview(
                    controller.signal
                );
                if (!alive) return;

                setData(result);
                setError(null);
            } catch (e) {
                if (!alive) return;
                console.error("[useRelapseOverview] failed", e);
                setError("Failed to load overview");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
            controller.abort();
        };
    }, []);

    return { data, loading, error };
};
