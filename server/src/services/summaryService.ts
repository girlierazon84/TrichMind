// server/src/services/summaryService.ts

import { User } from "../models/User";
import { SummaryLog } from "../models/SummaryLog";
import { sendMail } from "../utils/mailer";
import { buildWeeklySummaryEmail } from "../templates/weeklySummaryEmail";
import { loggerService } from "./loggerService";

export const summaryService = {
    /**
     * 📬 Send weekly summaries to all users
     * Returns summary statistics for reporting.
     */
    async sendWeeklySummaries() {
        let successCount = 0;
        let failedCount = 0;

        const users = await User.find({}, "email displayName").lean();
        if (!users.length) {
            await loggerService.log("No users found for weekly summary", "warning", "summary");
            return { ok: true, message: "No users found", successCount: 0, failedCount: 0 };
        }

        const weekOf = new Date();

        for (const user of users) {
            try {
                // Simulated summary data (replace with real analytics later)
                const summary = {
                    displayName: user.displayName,
                    avgRisk: Math.random() * 0.5 + 0.2,
                    topCoping: "Deep Breathing",
                    streakDays: Math.floor(Math.random() * 14),
                    totalSessions: Math.floor(Math.random() * 8) + 1,
                };

                // Build email + send
                const { html, text } = buildWeeklySummaryEmail(summary);
                await sendMail(user.email, "Your Weekly TrichMind Summary 🌼", html, text);

                // Log in DB
                await SummaryLog.create({
                    userId: user._id,
                    weekOf,
                    ...summary,
                    sentAt: new Date(),
                    status: "sent",
                });

                successCount++;
                await loggerService.logInfo("Weekly summary sent", { email: user.email });
            } catch (e: any) {
                failedCount++;
                await SummaryLog.create({
                    userId: user._id,
                    weekOf,
                    sentAt: new Date(),
                    status: "failed",
                });
                await loggerService.logError("Weekly summary failed", {
                    email: user.email,
                    error: e.message,
                });
            }
        }

        return {
            ok: true,
            message: `Sent ${successCount} summaries successfully (${failedCount} failed)`,
            successCount,
            failedCount,
        };
    },
};
