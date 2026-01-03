// client/src/services/relapseOverviewApi.ts

"use client";

import { axiosClient } from "@/services";


export type RiskLevel = "low" | "medium" | "high";

export interface RelapseSummary {
    risk_bucket: RiskLevel;
    risk_score: number;
    confidence: number;
    model_version?: string;
}

export interface RiskHistoryPoint {
    date: string;
    score: number;
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

async function fetchOverview(signal?: AbortSignal): Promise<RelapseOverviewResponse> {
    const res = await axiosClient.get<RelapseOverviewResponse>("/overview/relapse", { signal });
    return res.data;
}

export const relapseOverviewApi = { fetchOverview };
export default relapseOverviewApi;
