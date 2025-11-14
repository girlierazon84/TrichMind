// client/src/hooks/useJournal.ts

import { useState } from "react";
import { toast } from "react-toastify";
import { journalApi, type JournalEntry } from "@/services";
import { useLogger } from "@/hooks";


export const useJournal = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { log, error: logError } = useLogger(false);

    const create = async (entry: JournalEntry) => {
        setLoading(true);
        try {
            const res = await journalApi.create(entry);
            await log("Journal entry created", { mood: entry.mood });
            toast.success("Entry saved!");
            return res;
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Failed to save entry";
            setError(msg);
            await logError("Journal save failed", { error: msg });
            toast.error(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { create, loading, error };
};

export default useJournal;
