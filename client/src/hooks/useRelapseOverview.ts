// client/src/hooks/useRelapseOverview.ts

import { useEffect, useState } from "react";
import { axiosClient } from "@/services";

export type RiskLevel = "low" | "medium" | "high";

export interface RelapseSummary {
    risk_bucket: RiskLevel;
    risk_score: number;    // 0–1
    confidence: number;    // 0–1
    model_version?: string;
}

export interface RiskHistoryPoint {
    date: string;
    score: number; // 0–1
}

export interface RelapseOverviewResponse {
    ok: boolean;
    enoughData: boolean;
    relapseSummary: RelapseSummary | null;
    riskHistory: RiskHistoryPoint[];
    streak?: { current: number; previous: number };
    coping?: { worked: string[]; notWorked: string[] };
}

export const useRelapseOverview = () => {
    const [data, setData] = useState<RelapseOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                const res = await axiosClient.get<RelapseOverviewResponse>(
                    "/api/summary/overview"
                );
                if (!alive) return;
                setData(res.data);
                setError(null);
            } catch (e) {
                console.error("[useRelapseOverview] failed", e);
                if (!alive) return;
                setError("Failed to load overview");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    return { data, loading, error };
};
