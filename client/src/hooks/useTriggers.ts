// client/src/hooks/useTriggers.ts

import { useState } from "react";
import {
    triggersApi,
    type TriggerData,
    type TriggerListQuery,
    type TriggerListResponse,
    type TriggerUpdateResponse,
    type TriggerCreateResponse,
} from "@/services";
import { useLogger } from "@/hooks";

// ─────────────────────────────────────
// Hook to manage Triggers & Insights
// ─────────────────────────────────────
export const useTriggers = () => {
    const [triggers, setTriggers] = useState<TriggerData[]>([]);
    const [loading, setLoading] = useState(false);
    const { log } = useLogger(false);

    // 📋 Fetch triggers from backend
    const list = async (
        query?: TriggerListQuery
    ): Promise<TriggerListResponse | void> => {
        setLoading(true);
        try {
            const res = await triggersApi.list(query ?? {});
            setTriggers(res.triggers);
            return res;
        } finally {
            setLoading(false);
        }
    };

    // ➕ Create a new trigger
    const create = async (
        data: TriggerData
    ): Promise<TriggerCreateResponse | void> => {
        setLoading(true);
        try {
            const res = await triggersApi.create(data);
            await log("Trigger added", { name: data.name });
            // refresh list so Insights page sees the updated data
            await list({ page: 1, limit: 10, sort: "-frequency" });
            return res;
        } finally {
            setLoading(false);
        }
    };

    // ✏️ Update an existing trigger
    const update = async (
        id: string,
        data: Partial<TriggerData>
    ): Promise<TriggerUpdateResponse | void> => {
        setLoading(true);
        try {
            const res = await triggersApi.update(id, data);
            await log("Trigger updated", { id, ...data });
            await list({ page: 1, limit: 10, sort: "-frequency" });
            return res;
        } finally {
            setLoading(false);
        }
    };

    return { triggers, list, create, update, loading };
};

export default useTriggers;
