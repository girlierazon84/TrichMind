// client/src/hooks/useAlerts.ts

import {
    useState,
    useCallback,
    useEffect
} from "react";
import {
    alertApi,
    type AlertLog
} from "@/services";


/**
 * 🔔 useAlerts — React hook for managing relapse risk alerts
 */
export const useAlerts = () => {
    const [alerts, setAlerts] = useState<AlertLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** 📋 Fetch all alerts */
    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await alertApi.list();
            setAlerts(data);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to fetch alerts";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    /** 📩 Create a new alert */
    const createAlert = useCallback(async (alert: Omit<AlertLog, "_id" | "createdAt">) => {
        try {
            const created = await alertApi.create(alert);
            setAlerts((prev) => [created, ...prev]);
            return created;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to create alert";
            setError(msg);
            throw err;
        }
    }, []);

    /** ✅ Mark alert as sent */
    const markAsSent = useCallback(async (id: string, sent = true) => {
        try {
            const updated = await alertApi.markAsSent(id, sent);
            setAlerts((prev) =>
                prev.map((a) => (a._id === id ? { ...a, sent } : a))
            );
            return updated;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to update alert";
            setError(msg);
            throw err;
        }
    }, []);

    /** ❌ Remove alert */
    const removeAlert = useCallback(async (id: string) => {
        try {
            await alertApi.remove(id);
            setAlerts((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to delete alert";
            setError(msg);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    return {
        alerts,
        loading,
        error,
        fetchAlerts,
        createAlert,
        markAsSent,
        removeAlert,
    };
}

export default useAlerts