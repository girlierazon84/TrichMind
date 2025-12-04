// client/src/services/triggersInsightsApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**---------------------------------------------------------------------------------
    Data structures and API calls for managing triggers in the Insights feature.
------------------------------------------------------------------------------------*/
// TriggerData represents the structure of a trigger object.
export interface TriggerData {
    _id?: string;
    name: string;
    frequency?: number;
    createdAt?: string;
    updatedAt?: string;
}

// TriggerListQuery represents the query parameters for listing triggers.
export interface TriggerListQuery {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
}

// TriggerListResponse represents the response structure for listing triggers.
export interface TriggerListResponse {
    ok: boolean;
    count: number;
    triggers: TriggerData[];
}

// TriggerCreateResponse represents the response structure for creating a trigger.
export interface TriggerCreateResponse {
    ok: boolean;
    trigger: TriggerData;
}

// TriggerUpdateResponse represents the response structure for updating a trigger.
export interface TriggerUpdateResponse {
    ok: boolean;
    updated: TriggerData;
}

// Base endpoint for triggers API
const TRIGGERS_BASE = "/triggers";

// Raw API call to create a new trigger
async function rawCreate(data: TriggerData): Promise<TriggerCreateResponse> {
    // axiosClient baseURL already includes /api → use /triggers here
    const res = await axiosClient.post(TRIGGERS_BASE, data);
    return res.data as TriggerCreateResponse;
}

// Raw API call to list triggers with optional query parameters
async function rawList(
    params: TriggerListQuery = {}
): Promise<TriggerListResponse> {
    const res = await axiosClient.get(TRIGGERS_BASE, { params });
    return res.data as TriggerListResponse;
}

// Raw API call to update a trigger by ID
async function rawUpdate(
    id: string,
    data: Partial<TriggerData>
): Promise<TriggerUpdateResponse> {
    const res = await axiosClient.put(`${TRIGGERS_BASE}/${id}`, data);
    return res.data as TriggerUpdateResponse;
}

/**-------------------------------------------------------------
    Triggers API with logging wrappers around raw API calls.
----------------------------------------------------------------*/
export const triggersApi = {
    // using "ml" category to keep logging consistent with other ML-ish features
    create: withLogging(rawCreate, {
        category: "ml",
        action: "createTrigger",
        showToast: true,
        successMessage: "Trigger added successfully!",
        errorMessage: "Failed to add trigger.",
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
        errorMessage: "Failed to update trigger.",
    }),
};

export default triggersApi;
