// client/src/hooks/useTrichBot.ts

import { useState } from "react";
import { trichBotApi } from "@/services";
import { useLogger } from "@/hooks";
import type { TrichBotMessage } from "@/services";


/**-----------------------------------------
    Hook to manage TrichBot interactions
--------------------------------------------*/
export const useTrichBot = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { log, error: logError } = useLogger(false);

    // Send a message to TrichBot
    const sendMessage = async (
        prompt: string,
        intent?: string
    ): Promise<TrichBotMessage> => {
        setLoading(true);
        setError(null);
        try {
            const message = await trichBotApi.sendMessage({ prompt, intent });
            await log("TrichBot interaction", {
                prompt,
                intent,
                messageId: message._id,
            });
            return message;
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Failed to contact TrichBot.";
            setError(msg);
            await logError("TrichBot send failed", {
                error: msg,
                prompt,
                intent,
            });
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading, error };
};

export default useTrichBot;
