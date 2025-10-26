// server/src/templates/relapseAlertEmail.ts
import { buildBaseEmail } from "./baseEmail";

export const buildRelapseAlertEmail = (displayName?: string, score?: number) => {
    const name = displayName || "there";
    const percent = score ? Math.round(score * 100) : null;

    const contentHtml = `
        <p>Hi ${name},</p>
        <p>We noticed your recent reflection suggests your relapse risk might be <b>${percent ?? "elevated"}%</b>.</p>
        <p>Remember — relapse risk doesn’t define your progress. You’ve already taken a big step by tracking your patterns.</p>
        <p>Here are some things that can help you today:</p>
        <ul>
            <li>💨 Take 3 slow, deep breaths — center yourself.</li>
            <li>📔 Write down one thing you’re proud of this week.</li>
            <li>🤝 Reach out to your support network or open TrichMind’s calm tools.</li>
        </ul>
        <p style="text-align:center;">
            <a href="https://trichmind.app/dashboard" class="button">Open TrichMind App</a>
        </p>
        <p>Every data point helps us understand and support you better. You’re doing great — keep going! 💚</p>
    `;

    const html = buildBaseEmail("Your TrichMind Insight 🌱", contentHtml);

    const text = `
        Hi ${name},

        We noticed your recent check-in suggests a higher relapse risk (${percent ?? "elevated"}%).

        Remember, this doesn’t mean failure — it’s an opportunity to focus on self-care.

        💡 Quick tips:
        • Take a few deep breaths
        • Journal something positive
        • Use your favorite coping activity

        You’ve got this 💚
        — The TrichMind Team
    `;

    return { html, text };
};
