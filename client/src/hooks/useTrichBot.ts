// client/src/hooks/useTrichBot.ts
"use client";

import { useState } from "react";
import {
    trichBotApi,
    type TrichBotMessage
} from "@/services";
import { useLogger } from "@/hooks";


/**----------------------------------------------------------------------
    Hook to manage interactions with TrichBot
    Toasts should be handled in API layer or UI, not duplicated here.
-------------------------------------------------------------------------*/
// Function to interact with TrichBot API and manage loading/error states 
export const useTrichBot = () => {
    // State management for loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { log, error: logError } = useLogger(false);

    // Function to send a message to TrichBot and handle the response
    const sendMessage = async (prompt: string, intent?: string): Promise<TrichBotMessage> => {
        setLoading(true);
        setError(null);
        try {
            // Call the TrichBot API to send the message
            const message = await trichBotApi.sendMessage({ prompt, intent });
            void log("TrichBot interaction", { prompt, intent, messageId: message._id });
            return message;
        } catch (err: unknown) {
            // Handle errors and log them
            const msg = err instanceof Error ? err.message : "Failed to contact TrichBot.";
            setError(msg);
            void logError("TrichBot send failed", { error: msg, prompt, intent });
            throw err;
        } finally {
            // Reset loading state
            setLoading(false);
        }
    };

    return { sendMessage, loading, error };
};

export default useTrichBot;
