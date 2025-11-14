// client/src/hooks/useHealth.ts

import { useState } from "react";
import { toast } from "react-toastify";
import { healthApi, type HealthLogData } from "@/services";
import { useLogger } from "@/hooks";


export const useHealth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { log, error: logError } = useLogger(false);

    const create = async (data: HealthLogData) => {
        setLoading(true);
        try {
            const res = await healthApi.create(data);
            await log("Health log created", {
                sleep: data.sleepHours,
                stress: data.stressLevel,
            });
            toast.success("Health log created successfully!");
            return res;
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Failed to create health log";
            setError(msg);
            await logError("Health log creation failed", { error: msg });
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const list = async (params?: { from?: string; to?: string }) => {
        try {
            return await healthApi.list(params);
        } catch (err) {
            await logError("Failed to fetch health logs", {
                error: String(err),
            });
            throw err;
        }
    };

    return { create, list, loading, error };
};

export default useHealth;
