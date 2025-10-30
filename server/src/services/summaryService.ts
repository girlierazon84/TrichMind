// server/src/services/summaryService.ts

import { User } from "../models/User";
import { SummaryLog } from "../models/SummaryLog";
import { sendMail } from "../utils/mailer";
import { buildWeeklySummaryEmail } from "../templates/weeklySummaryEmail";
import { loggerService } from "./loggerService";

export const summaryService = {
    async sendWeeklySummaries() {
        const users = await User.find({}, "email displayName").lean();
        if (!users.length) return { ok: true, message: "No users found" };

        const weekOf = new Date();
        let successCount = 0;

        for (const user of users) {
            try {
                const summary = {
                    displayName: user.displayName,
                    avgRisk: Math.random() * 0.5 + 0.2,
                    topCoping: "Deep Breathing",
                    streakDays: Math.floor(Math.random() * 14),
                    totalSessions: Math.floor(Math.random() * 8) + 1,
                };

                const { html, text } = buildWeeklySummaryEmail(summary);
                await sendMail(user.email, "Your Weekly TrichMind Summary 🌼", html, text);
                await SummaryLog.create({ userId: user._id, weekOf, ...summary, status: "sent" });
                successCount++;
            } catch (e: any) {
                await SummaryLog.create({ userId: user._id, weekOf, status: "failed" });
                await loggerService.logError("Weekly summary failed", { email: user.email, error: e.message });
            }
        }

        return { ok: true, message: `Sent ${successCount} summaries successfully` };
    },
};
