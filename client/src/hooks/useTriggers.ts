// client/src/hooks/useTriggers.ts

import { useState } from "react";
import { triggersApi, type TriggerData } from "@/services";
import { useLogger } from "@/hooks";


export function useTriggers() {
    const [loading, setLoading] = useState(false);
    const { log } = useLogger(false);

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
