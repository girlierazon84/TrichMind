// server/src/templates/welcomeEmail.ts
import { buildBaseEmail } from "./baseEmail";

export const buildWelcomeEmail = (displayName?: string) => {
    const name = displayName || "there";

    const contentHtml = `
        <p>Hi ${name},</p>
        <p>Welcome to <b>TrichMind</b> — we're so glad to have you here!</p>
        <p>Our app is designed to help you understand your patterns, manage triggers,
            and find supportive strategies that work for <i>you</i>.</p>
        <p style="text-align:center;">
            <a href="https://trichmind.app/login" class="button">Get Started</a>
        </p>
        <p>If you ever need help, feel free to reply to this email or visit our support page.</p>
    `;

    const html = buildBaseEmail("Welcome to TrichMind!", contentHtml);
    const text = `
        Hi ${name},

        Welcome to TrichMind — we’re glad you joined! 🎉
        You can log in anytime at https://trichmind.app/login

        If you ever need help, reply to this email — we're here for you.

        — The TrichMind Team
    `;

    return { html, text };
};
