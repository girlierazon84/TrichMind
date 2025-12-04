// client/src/services/healthApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**--------------------------------------------------------------
    🩺 HealthLogData — Data structure for health log entries
-----------------------------------------------------------------*/
export interface HealthLogData {
    sleepHours: number;
    stressLevel: number;
    exerciseMinutes: number;
    date?: string;
}

// Constants
const HEALTH_BASE = "/health";

/**-----------------------------------
    Basic CRUD Operations
    Raw functions without logging
--------------------------------------*/
// Raw Create
async function rawCreate(data: HealthLogData) {
    // axiosClient baseURL already includes /api → use /health here
    const res = await axiosClient.post(HEALTH_BASE, data);
    return res.data;
}

// Raw List
async function rawList(params?: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    sort?: string;
}) {
    // axiosClient baseURL already includes /api → use /health here
    const res = await axiosClient.get(HEALTH_BASE, { params });
    return res.data;
}

// Raw Get By ID
async function rawGetById(id: string) {
    const res = await axiosClient.get(`${HEALTH_BASE}/${id}`);
    return res.data;
}

// Raw Update
async function rawUpdate(id: string, data: Partial<HealthLogData>) {
    const res = await axiosClient.put(`${HEALTH_BASE}/${id}`, data);
    return res.data;
}

// Raw Remove
async function rawRemove(id: string) {
    const res = await axiosClient.delete(`${HEALTH_BASE}/${id}`);
    return res.data;
}

/**-----------------------------
    Health API with Logging
--------------------------------*/
export const healthApi = {
    create: withLogging(rawCreate, {
        category: "ui",
        action: "healthCreate",
        showToast: true,
        successMessage: "Health log created successfully!",
        errorMessage: "Failed to log health entry.",
    }),
    list: withLogging(rawList, { category: "ui", action: "healthList" }),
    getById: withLogging(rawGetById, { category: "ui", action: "healthGet" }),
    update: withLogging(rawUpdate, {
        category: "ui",
        action: "healthUpdate",
        showToast: true,
        successMessage: "Health log updated!",
        errorMessage: "Failed to update health log.",
    }),
    remove: withLogging(rawRemove, {
        category: "ui",
        action: "healthRemove",
        showToast: true,
        successMessage: "Health log deleted.",
        errorMessage: "Failed to delete health log.",
    }),
};

export default healthApi;