// client/src/services/relapseOverviewApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils/withLogging";

/**----------------------------
    Risk level from backend
-------------------------------*/
export type RiskLevel = "low" | "medium" | "high";

export interface RelapseSummary {
    risk_bucket: RiskLevel;
    risk_score: number; // 0–1
    confidence: number; // 0–1
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

/**-------------------------------
    Raw API call (no logging).
----------------------------------*/
async function rawFetchOverview(
    signal?: AbortSignal
): Promise<RelapseOverviewResponse> {
    const res = await axiosClient.get<RelapseOverviewResponse>(
        "/api/summary/overview",
        { signal }
    );
    return res.data;
}

/**---------------------------------------------------------
    Small API wrapper for the relapse overview endpoint,
    wrapped with unified logging.
------------------------------------------------------------*/
export const relapseOverviewApi = {
    fetchOverview: withLogging(rawFetchOverview, {
        category: "ml", // or "summary" / "analytics" if you prefer
        action: "relapse_overview",
        showToast: false, // no toasts for background dashboard fetch
    }),
};
