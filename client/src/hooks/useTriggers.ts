// client/src/hooks/useTriggers.ts
"use client";

import { useState } from "react";
import {
    triggersApi,
    type TriggersInsightsData,
    type TriggersListQuery,
    type TriggersListResponse,
    type TriggersUpdateResponse,
    type TriggersCreateResponse,
} from "@/services";
import { useLogger } from "@/hooks";


/**----------------------------------------------------------------------
    Hook to manage triggers insights
    Toasts should be handled in API layer or UI, not duplicated here.
-------------------------------------------------------------------------*/
export const useTriggers = () => {
    // State to hold triggers data
    const [triggers, setTriggers] = useState<TriggersInsightsData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { log, error: logError } = useLogger(false);

    // Function to list triggers with optional query parameters
    const list = async (query?: TriggersListQuery): Promise<TriggersListResponse | void> => {
        // Set loading state and clear previous errors
        setLoading(true);
        setError(null);
        try {
            // Fetch triggers from the API
            const res = await triggersApi.list(query ?? {});
            setTriggers(res.triggers);
            return res;
        } catch (err: unknown) {
            // Handle errors and log them
            const msg = err instanceof Error ? err.message : "Failed to load triggers";
            setError(msg);
            void logError("Trigger list failed", { error: msg });
        } finally {
            // Reset loading state
            setLoading(false);
        }
    };

    // Function to create a new trigger
    const create = async (data: TriggersInsightsData): Promise<TriggersCreateResponse | void> => {
        // Set loading state and clear previous errors
        setLoading(true);
        setError(null);
        try {
            // Create trigger via the API
            const res = await triggersApi.create(data);
            void log("Trigger added", { name: data.name });
            await list({ page: 1, limit: 10, sort: "-frequency" });
            return res;
        } catch (err: unknown) {
            // Handle errors and log them
            const msg = err instanceof Error ? err.message : "Failed to create trigger";
            setError(msg);
            void logError("Trigger create failed", { error: msg });
        } finally {
            // Reset loading state
            setLoading(false);
        }
    };

    // Function to update an existing trigger
    const update = async (id: string, data: Partial<TriggersInsightsData>): Promise<TriggersUpdateResponse | void> => {
        // Set loading state and clear previous errors
        setLoading(true);
        setError(null);
        try {
            // Update trigger via the API
            const res = await triggersApi.update(id, data);
            void log("Trigger updated", { id, ...data });
            await list({ page: 1, limit: 10, sort: "-frequency" });
            return res;
        } catch (err: unknown) {
            // Handle errors and log them
            const msg = err instanceof Error ? err.message : "Failed to update trigger";
            setError(msg);
            void logError("Trigger update failed", { error: msg });
        } finally {
            // Reset loading state
            setLoading(false);
        }
    };

    return { triggers, list, create, update, loading, error };
};

export default useTriggers;
