// server/src/controllers/summaryController.ts
import { Request, Response } from "express";
import { User } from "../models/User";
import SummaryLog from "../models/SummaryLog";
import { sendMail } from "../utils/mailer";
import { buildWeeklySummaryEmail } from "../templates/weeklySummaryEmail";
import { logger } from "../utils/logger";

export const sendWeeklySummaries = async (_req: Request, res: Response) => {
    try {
        const users = await User.find({}, "email displayName").lean();

        if (!users.length) {
            logger.warn("⚠️ No users found for weekly summary.");
            return res.json({ ok: true, message: "No users found" });
        }

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

                await SummaryLog.create({
                    userId: user._id,
                    weekOf,
                    ...summary,
                    sentAt: new Date(),
                    status: "sent",
                });

                successCount++;
                logger.info(`📧 Sent weekly summary to ${user.email}`);
            } catch (e: any) {
                await SummaryLog.create({
                    userId: user._id,
                    weekOf,
                    sentAt: new Date(),
                    status: "failed",
                });
                logger.error(`❌ Failed summary for ${user.email}: ${e.message}`);
            }
        }

        res.json({ ok: true, message: `Sent ${successCount} summaries successfully` });
    } catch (err: any) {
        logger.error(`❌ Weekly summary error: ${err.message}`);
        res.status(500).json({ error: "Failed to send summaries" });
    }
};
