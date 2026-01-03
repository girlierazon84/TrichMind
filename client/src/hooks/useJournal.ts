// client/src/hooks/useJournal.ts
"use client";

import { useState } from "react";
import {
    journalApi,
    type JournalEntry
} from "@/services";
import { useLogger } from "@/hooks";


/**-------------------------------------------
    Custom hook to manage journal entries.
    Handles creation of journal entries.
----------------------------------------------*/
// Main useJournal hook implementation
export const useJournal = () => {
    // State for loading and error handling
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { log, error: logError } = useLogger(false);

    // Create a new journal entry via the API and handle state accordingly
    const create = async (entry: JournalEntry) => {
        // Reset error and set loading state while creating journal entry
        setLoading(true);
        setError(null);
        try {
            // Call the journal API to create a new entry and log success
            const res = await journalApi.create(entry); // API layer already handles toast if enabled
            void log("Journal entry created", { mood: entry.mood });
            return res;
        } catch (err: unknown) {
            // On error, set error state and log the failure with details
            const msg = err instanceof Error ? err.message : "Failed to save entry";
            setError(msg);
            void logError("Journal save failed", { error: msg });
            throw err;
        } finally {
            // Reset loading state after operation completes (whether success or failure)
            setLoading(false);
        }
    };

    return { create, loading, error };
};

export default useJournal;
