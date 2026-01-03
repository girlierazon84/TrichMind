// client/src/services/trichBotApi.ts
"use client";

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**----------------------------------------
    * TrichBot API Types and Interfaces
-------------------------------------------*/
// Represents a message exchanged with the TrichBot service including prompts, responses, and feedback.
export interface TrichBotMessage {
    _id?: string;
    prompt: string;
    response?: string;
    tips?: string[];
    riskScore?: number;
    intent?: string;
    modelInfo?: { name?: string; version?: string };
    feedback?: { helpful?: boolean; rating?: number; comment?: string };
    createdAt?: string;
}

// Response structure for creating a new TrichBot message.
export interface TrichBotCreateResponse {
    ok: boolean;
    message: TrichBotMessage;
}

// Response structure for listing TrichBot messages.
export interface TrichBotListResponse {
    ok: boolean;
    count: number;
    messages: TrichBotMessage[];
}

// Response structure for submitting feedback on a TrichBot message.
export interface TrichBotFeedbackResponse {
    ok: boolean;
    message: TrichBotMessage;
}

// Base endpoint for TrichBot API interactions.
const BOT_BASE = "/trichbot";

/**----------------------------------------------------------------------------------------------------------------
    Raw API Functions for TrichBot Service - These functions interact directly with the TrichBot API endpoints.
    They are wrapped with logging functionality in the exported trichBotApi object.
-------------------------------------------------------------------------------------------------------------------*/
// Sends a message to the TrichBot service and returns the generated response message.
async function rawSendMessage(payload: { prompt: string; intent?: string }): Promise<TrichBotMessage> {
    // Send POST request to TrichBot API with the user's prompt and optional intent.
    const res = await axiosClient.post<TrichBotCreateResponse>(BOT_BASE, payload);
    return res.data.message;
}

// Retrieves a list of TrichBot messages with optional pagination and sorting parameters.
async function rawList(params?: { page?: number; limit?: number; sort?: string }): Promise<TrichBotMessage[]> {
    // Send GET request to TrichBot API to fetch messages with provided query parameters.
    const res = await axiosClient.get<TrichBotListResponse>(BOT_BASE, { params });
    return res.data.messages;
}

// Submits feedback for a specific TrichBot message identified by its ID. Returns the updated message with feedback.
async function rawFeedback(
    id: string,
    data: TrichBotMessage["feedback"]
): Promise<TrichBotMessage> {
    // Send PUT request to TrichBot API to submit feedback for the specified message ID.
    const res = await axiosClient.put<TrichBotFeedbackResponse>(`${BOT_BASE}/${id}/feedback`, data);
    return res.data.message;
}

// Clears the entire history of TrichBot messages. No return value.
async function rawClearHistory(): Promise<void> {
    // Send DELETE request to TrichBot API to clear message history.
    await axiosClient.delete(`${BOT_BASE}/history`);
    // 204 => no body
}

// Exported TrichBot API object with logging functionality wrapped around raw API functions.
export const trichBotApi = {
    sendMessage: withLogging(rawSendMessage, { category: "ml", action: "trichbot_sendMessage" }),
    list: withLogging(rawList, { category: "ml", action: "trichbot_list" }),
    feedback: withLogging(rawFeedback, { category: "ml", action: "trichbot_feedback" }),
    clearHistory: withLogging(rawClearHistory, { category: "ml", action: "trichbot_clearHistory" }),
};

export default trichBotApi;
