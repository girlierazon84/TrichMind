// server/src/templates/weeklySummaryEmail.ts

import { buildBaseEmail } from "./baseEmail";

type WeeklySummaryData = {
    displayName?: string;
    avgRisk?: number; // 0..1
    topCoping?: string;
    streakDays?: number;
    totalSessions?: number;
    dashboardUrl: string; // should come from ENV.CLIENT_URL + "/dashboard"
};

export const buildWeeklySummaryEmail = (data: WeeklySummaryData) => {
    const name = data.displayName?.trim() || "there";
    const risk =
        typeof data.avgRisk === "number" ? `${Math.round(data.avgRisk * 100)}%` : "N/A";
    const topCoping = data.topCoping?.trim() || "N/A";
    const streak = data.streakDays ?? 0;
    const sessions = data.totalSessions ?? 0;

    const contentHtml = `
        <p>Hi ${name},</p>
        <p>Here’s your TrichMind summary for this week 💚</p>
        <ul>
            <li>📊 <b>Average relapse risk:</b> ${risk}</li>
            <li>🧠 <b>Most used coping strategy:</b> ${topCoping}</li>
            <li>🔥 <b>Consistency streak:</b> ${streak} day${streak === 1 ? "" : "s"}</li>
            <li>📅 <b>Sessions completed:</b> ${sessions}</li>
        </ul>
        <p>Keep reflecting, keep learning — every check-in strengthens your awareness and resilience.</p>
        <p>See you next week for more insights 🌿</p>
    `;

    const html = buildBaseEmail({
        title: "Your Weekly TrichMind Summary 🌼",
        preheader: "Your weekly summary is ready.",
        contentHtml,
        buttonText: "Open Dashboard",
        buttonUrl: data.dashboardUrl,
    });

    const text = [
        `Hi ${name},`,
        "",
        "Here’s your TrichMind summary for this week:",
        "",
        `• Average relapse risk: ${risk}`,
        `• Most used coping strategy: ${topCoping}`,
        `• Consistency streak: ${streak} day${streak === 1 ? "" : "s"}`,
        `• Sessions completed: ${sessions}`,
        "",
        `Open dashboard: ${data.dashboardUrl}`,
        "",
        "Keep going — every reflection supports your growth 💚",
        "— The TrichMind Team",
    ].join("\n");

    return { html, text };
};
