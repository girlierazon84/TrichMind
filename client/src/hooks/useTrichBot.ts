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
    const { log } = useLogger(false);

    // Send a message to TrichBot
    const sendMessage = async (
        prompt: string,
        intent?: string
    ): Promise<TrichBotMessage> => {
        setLoading(true);
        try {
            const message = await trichBotApi.sendMessage({ prompt, intent });
            await log("TrichBot interaction", {
                prompt,
                intent,
                messageId: message._id,
            });
            return message;
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading };
};

export default useTrichBot;
