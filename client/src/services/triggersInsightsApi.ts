// client/src/services/triggersInsightsApi.ts

import { axiosClient } from "./axiosClient";
import { withLogging } from "@/utils/withLogging";


export interface TriggerData {
    _id?: string;
    name: string;
    frequency?: number;
}

async function rawCreate(data: TriggerData) {
    const res = await axiosClient.post("/triggers", data);
    return res.data;
}

export const triggersApi = {
    create: withLogging(rawCreate, {
        category: "ml",
        action: "createTrigger",
        showToast: true,
        successMessage: "Trigger added successfully!",
    }),
};
