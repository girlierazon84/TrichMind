// server/src/templates/weeklySummaryEmail.ts
import { buildBaseEmail } from "./baseEmail";

export const buildWeeklySummaryEmail = (data: {
    displayName?: string;
    avgRisk?: number;
    topCoping?: string;
    streakDays?: number;
    totalSessions?: number;
}) => {
    const name = data.displayName || "there";
    const risk = data.avgRisk !== undefined ? `${Math.round(data.avgRisk * 100)}%` : "N/A";
    const topCoping = data.topCoping || "N/A";
    const streak = data.streakDays ?? 0;
    const sessions = data.totalSessions ?? 0;

    const contentHtml = `
        <p>Hi ${name},</p>
        <p>Here's your TrichMind summary for this week 💚</p>
        <ul>
            <li>📊 <b>Average Relapse Risk:</b> ${risk}</li>
            <li>🧠 <b>Most Used Coping Strategy:</b> ${topCoping}</li>
            <li>🔥 <b>Consistency Streak:</b> ${streak} days</li>
            <li>📅 <b>Weekly Sessions Completed:</b> ${sessions}</li>
        </ul>
        <p>Keep reflecting, keep learning — every check-in strengthens your awareness and resilience.</p>
        <p style="text-align:center;">
            <a href="https://trichmind.app/dashboard" class="button">Open Dashboard</a>
        </p>
        <p>See you next week for more insights 🌿</p>
    `;

    const html = buildBaseEmail("Your Weekly TrichMind Summary 🌼", contentHtml);

    const text = `
        Hi ${name},

        Here’s your TrichMind summary for this week:

        • Average Relapse Risk: ${risk}
        • Most Used Coping Strategy: ${topCoping}
        • Consistency Streak: ${streak} days
        • Weekly Sessions Completed: ${sessions}

        Keep going — every reflection helps your growth 💚
        — The TrichMind Team
    `;

    return { html, text };
};
