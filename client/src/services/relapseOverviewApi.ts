// client/src/services/relapseOverviewApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils/withLogging";

/** Risk level from backend */
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
    dataCounts?: {
        journalEntries: number;
        healthLogs: number;
        minJournalNeeded: number;
        minHealthNeeded: number;
    };
}

/** Raw fetch (no logging) */
async function _fetchOverview(
    signal?: AbortSignal
): Promise<RelapseOverviewResponse> {
    const res = await axiosClient.get<RelapseOverviewResponse>(
        "/api/overview/relapse",
        { signal }
    );
    return res.data;
}

/**
 * Wrapped with logging so every overview fetch is logged to backend.
 */
export const relapseOverviewApi = {
    fetchOverview: withLogging(_fetchOverview, {
        category: "summary",
        action: "relapse_overview_fetch",
        showToast: false,
    }),
};
