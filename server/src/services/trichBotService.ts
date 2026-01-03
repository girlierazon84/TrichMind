// server/src/services/trichBotService.ts

import OpenAI from "openai";
import type { SortOrder } from "mongoose";
import { ENV } from "../config";
import {
    type ITrichBotMessage,
    type TrichBotMessageDocument,
    TrichBotMessage
} from "../models";
import type {
    TrichBotCreateDTO,
    TrichBotListQueryDTO,
    TrichBotFeedbackDTO
} from "../schemas";
import { loggerService } from "./loggerService";


/**---------------------------------------------
    ENV (single source of truth: ENV)
------------------------------------------------*/
const TRICHBOT_ENABLED = ENV.TRICHBOT_ENABLED;
const DEFAULT_MODEL = ENV.OPENAI_MODEL ?? "gpt-4.1-mini";

// Keep API key optional (bot can be disabled in dev)
const openaiApiKey = process.env.OPENAI_API_KEY?.trim() || "";

// OpenAI client (dummy key is fine if TrichBot is disabled)
const openai = new OpenAI({ apiKey: openaiApiKey || "dummy" });

/**------------
    Helpers
---------------*/

// Detect if the prompt is a greeting or intro question
function isGreetingMessage(prompt: string): boolean {
    // Normalize input
    const trimmed = prompt.trim();
    const lower = trimmed.toLowerCase();

    // Short greetings like "hi", "hello!", "hey there"
    const shortGreeting =
        trimmed.length <= 40 && /^(hi|hello|hey|hej|hola|hallo|hei)[!.? ]*$/i.test(lower);

    // Introductory questions about the bot/app
    const introQuestion =
        /who are you|what do you do|what are you|what is this app|what is trichmind|what is trichbot/i.test(
            lower
        );

    // Return true if either condition matches
    return shortGreeting || introQuestion;
}

// Build messages array for OpenAI responses API
function buildMessages(prompt: string, intent?: string) {
    // Determine if it's a greeting message
    const greeting = isGreetingMessage(prompt);

    // System prompt for distress vs greeting
    const distressSystem = `
You are TrichBot, the in-app assistant inside the TrichMind app. TrichMind is a supportive digital companion for people living with trichotillomania.

TrichMind context (features you can mention):
- A relapse risk dashboard that shows how their risk is trending over time.
- Daily check-ins / urge tracking cards where they can log urges, emotions, and small wins.
- A coping strategies card/library where they can save what has worked or not worked.
- Notes / journaling space to process thoughts, triggers, and patterns.
- A relapse overview / history view that shows ups and downs over time.
- This TrichBot chat, where they can talk through urges, stress, and questions.
- Gentle reminders about self-compassion and small steps forward.
- Mini-games for urge management.
- HYGA Essentials calming kits and tools.

IMPORTANT:
- You do NOT see real-time data from their dashboard.
- Never claim you can see their score/entries.

When the user shares urges or distress:
- Validate in 2–3 sentences.
- Mention a relevant TrichMind feature (general).
- Give up to 3 coping ideas in numbered format:
    1. ...
    2. ...
    3. ...

Optional:
- If appropriate and not pushy, include ONE short Bible verse at the end wrapped in <verse>...</verse>.
- Do NOT add markdown around it.

Aim ~120–180 words total.
`.trim();

    // System prompt for greetings / intro questions
    const greetingSystem = `
You are TrichBot, the in-app assistant inside the TrichMind app.

For greetings / intro questions:
- Reply in 2–4 sentences.
- Briefly describe how you can help (urges, feelings, coping ideas).
- Mention a few TrichMind features.
- Make it clear you can't see their personal data.
- No numbered tips and no Bible verse in this case.
`.trim();

    // Choose system prompt based on message type
    let system = greeting ? greetingSystem : distressSystem;
    // Add intent hint if provided and not a greeting
    if (intent && !greeting) system += `\n\nUser intent hint: ${intent}`;

    // Build and return messages array
    return [
        { role: "system" as const, content: system },
        { role: "user" as const, content: prompt },
    ];
}

// Extract text response from OpenAI response object
function extractText(resp: any): string {
    // Newer format with 'output' field
    const first = resp?.output?.[0];
    // Check for 'content' field
    if (first && "content" in first) {
        const textPart = first.content?.find((p: any) => p.type === "output_text");
        if (textPart?.text) return textPart.text;
    }

    // Fallbacks
    const choice = resp?.choices?.[0];
    // Return content from choice or older formats
    return (
        choice?.message?.content ||
        resp?.output_text?.[0]?.content?.[0]?.text ||
        "I'm here for you. 💚"
    );
}

// Emphasise Bible verses in the text (HTML-safe for your UI renderer)
function emphasiseBibleVerse(text: string): string {
    let output = text;
    output = output.replace(/<verse>\s*([\s\S]*?)\s*<\/verse>/i, "<strong><em>$1</em></strong>");
    output = output.replace(/\*\*_(.+?)_\*\*/g, "<strong><em>$1</em></strong>");
    return output;
}

// Extract up to 3 numbered tips from the text
function extractTips(text: string): string[] {
    return text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^\d+\.\s+/.test(line))
        .map((line) => line.replace(/^\d+\.\s+/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
}

/**---------------------
    TrichBot Service
------------------------*/

export const botService = {
    // Create a new TrichBot message
    async createMessage(userId: string, data: TrichBotCreateDTO): Promise<TrichBotMessageDocument> {
        // Extract prompt and intent
        const { prompt, intent } = data;

        // If TrichBot is disabled, store offline message
        if (!TRICHBOT_ENABLED) {
            // Store a placeholder response
            const doc = await TrichBotMessage.create({
                userId,
                prompt,
                response:
                    "TrichBot is currently turned off in this demo environment, but the rest of TrichMind still works 🌿",
                tips: [],
                intent,
                modelInfo: { name: "disabled", version: "offline" },
            });

            // Log the offline storage
            void loggerService.logInfo(
                "TrichBot disabled: stored offline message",
                { userId },
                "system",
                userId
            );

            return doc;
        }

        // If enabled, require API key
        if (!openaiApiKey) {
            // Log the missing API key error
            void loggerService.logError(
                "TrichBot enabled but OPENAI_API_KEY missing",
                { userId },
                "system",
                userId
            );
            throw new Error("OPENAI_API_KEY is not configured. TrichBot cannot respond right now.");
        }

        // Start timing
        const started = Date.now();

        // Call OpenAI responses API
        let response: any;
        try {
            response = await openai.responses.create({
                model: DEFAULT_MODEL,
                input: buildMessages(prompt, intent),
            });
        } catch (err: any) {
            // Log the error details
            void loggerService.logError(
                "TrichBot OpenAI request failed",
                {
                    userId,
                    status: err?.status,
                    code: err?.code,
                    message: err?.message ?? String(err),
                },
                "network",
                userId
            );
            // Rethrow a generic error
            throw new Error("TrichBot AI backend is not available right now.");
        }

        // Process the response
        const rawText = extractText(response);
        const text = emphasiseBibleVerse(rawText);
        const tips = extractTips(text);
        const runtimeSec = (Date.now() - started) / 1000;

        // Store the message in the database
        const doc = await TrichBotMessage.create({
            userId,
            prompt,
            response: text,
            tips,
            intent,
            modelInfo: {
                name: DEFAULT_MODEL,
                version: response?.id ?? undefined,
            },
        });

        // Log the successful storage
        void loggerService.logInfo(
            "TrichBot message stored",
            { userId, messageId: doc._id, runtimeSec, model: DEFAULT_MODEL },
            "system",
            userId
        );

        return doc;
    },

    // List TrichBot messages for a user (pagination + sorting)
    async listMessages(userId: string, query: TrichBotListQueryDTO): Promise<ITrichBotMessage[]> {
        // Extract pagination and sorting parameters
        const { page, limit, sort } = query;

        // Build sort object
        const sortObj: Record<string, SortOrder> =
            sort?.startsWith("-")
                ? { [sort.slice(1)]: -1 as SortOrder }
                : { [sort ?? "createdAt"]: 1 as SortOrder };

        // Query the database with pagination and sorting
        return TrichBotMessage.find({ userId })
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean<ITrichBotMessage[]>()
            .exec();
    },

    // Update feedback for a specific TrichBot message
    async updateFeedback(id: string, feedback: TrichBotFeedbackDTO): Promise<ITrichBotMessage | null> {
        return TrichBotMessage.findByIdAndUpdate(id, { $set: { feedback } }, { new: true })
            .lean<ITrichBotMessage | null>()
            .exec();
    },

    // Clear all TrichBot messages for a user
    async clearMessages(userId: string): Promise<number> {
        // Delete all messages for the user
        const result = await TrichBotMessage.deleteMany({ userId }).exec();
        return result.deletedCount ?? 0;
    },
};

export default botService;
