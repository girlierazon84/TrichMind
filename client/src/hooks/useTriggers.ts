// client/src/hooks/useTriggers.ts

import { useState } from "react";
import {
    triggersApi,
    type TriggerData
} from "@/services";
import { useLogger } from "@/hooks";


// ─────────────────────────────────────
// Hook to manage Triggers
// ─────────────────────────────────────
export const useTriggers = () => {
    // Loading state
    const [loading, setLoading] = useState(false);
    const { log } = useLogger(false);

    // Create a new trigger
    const create = async (data: TriggerData) => {
        setLoading(true);
        try {
            const res = await triggersApi.create(data);
            await log("Trigger added", { name: data.name });
            return res;
        } finally {
            setLoading(false);
        }
    };

    return { create, loading };
}

export default useTriggers;