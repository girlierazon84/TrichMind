// client/src/services/triggersInsightsApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";

export interface TriggerData {
    _id?: string;
    name: string;
    frequency?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface TriggerListQuery {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
}

export interface TriggerListResponse {
    ok: boolean;
    count: number;
    triggers: TriggerData[];
}

export interface TriggerCreateResponse {
    ok: boolean;
    trigger: TriggerData;
}

export interface TriggerUpdateResponse {
    ok: boolean;
    updated: TriggerData;
}

async function rawCreate(data: TriggerData): Promise<TriggerCreateResponse> {
    const res = await axiosClient.post("/api/triggers", data);
    return res.data as TriggerCreateResponse;
}

async function rawList(
    params: TriggerListQuery = {}
): Promise<TriggerListResponse> {
    const res = await axiosClient.get("/api/triggers", { params });
    return res.data as TriggerListResponse;
}

async function rawUpdate(
    id: string,
    data: Partial<TriggerData>
): Promise<TriggerUpdateResponse> {
    const res = await axiosClient.put(`/api/triggers/${id}`, data);
    return res.data as TriggerUpdateResponse;
}

export const triggersApi = {
    // use a valid logging category, e.g. "ml"
    create: withLogging(rawCreate, {
        category: "ml",
        action: "createTrigger",
        showToast: true,
        successMessage: "Trigger added successfully!",
    }),
    list: withLogging(rawList, {
        category: "ml",
        action: "listTriggers",
        showToast: false,
    }),
    update: withLogging(rawUpdate, {
        category: "ml",
        action: "updateTrigger",
        showToast: true,
        successMessage: "Trigger updated.",
    }),
};
