// server/src/templates/relapseAlertEmail.ts

import { buildBaseEmail } from "./baseEmail";

type RelapseAlertEmailArgs = {
    displayName?: string;
    score?: number; // 0..1
    dashboardUrl: string; // should come from ENV.CLIENT_URL + "/dashboard"
};

export const buildRelapseAlertEmail = ({
    displayName,
    score,
    dashboardUrl,
    }: RelapseAlertEmailArgs) => {
        const name = displayName?.trim() || "there";
        const percent = typeof score === "number" ? Math.round(score * 100) : undefined;

        const contentHtml = `
            <p>Hi ${name},</p>
            <p>
                We noticed your recent reflection suggests your relapse risk might be
                <b>${percent !== undefined ? `${percent}%` : "elevated"}</b>.
            </p>
            <p>
                Remember — relapse risk doesn’t define your progress. You’ve already taken a big step by tracking your patterns.
            </p>
            <p>Here are a few gentle steps you can try today:</p>
            <ul>
                <li>💨 Take 3 slow, deep breaths — bring your focus back to the present.</li>
                <li>📔 Write down one thing you’re proud of this week.</li>
                <li>🤝 Use a coping tool that’s worked before (or reach out to your support).</li>
            </ul>
        <p class="muted">You’re not alone — and you’re still moving forward 💚</p>
    `;

    const html = buildBaseEmail({
        title: "Your TrichMind Insight 🌱",
        preheader: "A gentle check-in and a few supportive steps for today.",
        contentHtml,
        buttonText: "Open TrichMind Dashboard",
        buttonUrl: dashboardUrl,
    });

    const text = [
        `Hi ${name},`,
        "",
        `We noticed your recent check-in suggests a relapse risk that may be ${
            percent !== undefined ? `${percent}%` : "elevated"
        }.`,
        "",
        "This doesn’t mean failure — it’s a sign to lean into self-care.",
        "",
        "Quick tips:",
        "• Take 3 slow deep breaths",
        "• Journal one thing you’re proud of",
        "• Use a coping tool or reach out to support",
        "",
        `Open your dashboard: ${dashboardUrl}`,
        "",
        "You’ve got this 💚",
        "— The TrichMind Team",
    ].join("\n");

    return { html, text };
};
