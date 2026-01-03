// client/src/hooks/useHealth.ts
"use client";

import { useState } from "react";
import { healthApi, type HealthLogData } from "@/services";
import { useLogger } from "@/hooks";


/**----------------------------------------------------------
    Custom hook to manage health logs.
    Handles creation and retrieval of health log entries.
-------------------------------------------------------------*/
// Main useHealth hook implementation
export const useHealth = () => {
    // State for loading and error handling
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { log, error: logError } = useLogger(false);

    // Create a new health log entry via the API and handle state accordingly
    const create = async (data: HealthLogData) => {
        // Reset error and set loading state while creating log entry
        setLoading(true);
        setError(null);
        try {
            // Call the health API to create a new log entry and log success
            const res = await healthApi.create(data); // API layer already handles toast if enabled
            void log("Health log created", {
                sleep: data.sleepHours,
                stress: data.stressLevel,
            });
            return res;
        } catch (err: unknown) {
            // On error, set error state and log the failure with details
            const msg = err instanceof Error ? err.message : "Failed to create health log";
            setError(msg);
            void logError("Health log creation failed", { error: msg });
            throw err;
        } finally {
            // Reset loading state after operation completes (whether success or failure)
            setLoading(false);
        }
    };

    // List health log entries via the API with optional filtering and pagination
    const list = async (params?: {
        // Optional query parameters for filtering and pagination of health logs
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
        sort?: string;
    }) => {
        try {
            // Call the health API to retrieve the list of health logs with provided parameters
            return await healthApi.list(params);
        } catch (err: unknown) {
            // On error, log the failure with details and rethrow the error
            void logError("Failed to fetch health logs", { error: String(err) });
            throw err;
        }
    };

    return { create, list, loading, error };
};

export default useHealth;
