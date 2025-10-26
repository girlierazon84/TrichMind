import { Request, Response } from "express";
import User from "../models/User";
import { sendMail } from "../utils/mailer";
import { buildWeeklySummaryEmail } from "../templates/weeklySummaryEmail";
import { logger } from "../utils/logger";

/**
 * Sends weekly summary to all users (can be scheduled or manual)
 */
export const sendWeeklySummaries = async (_req: Request, res: Response) => {
    try {
        const users = await User.find({}, "email displayName").lean();

        if (!users.length) {
            logger.warn("⚠️ No users found for weekly summary.");
            return res.json({ ok: true, message: "No users found" });
        }

        for (const user of users) {
            // Mock stats (in production, query from DB or ML predictions)
            const summary = {
                displayName: user.displayName,
                avgRisk: Math.random() * 0.5 + 0.2, // 20–70%
                topCoping: "Deep Breathing",
                streakDays: Math.floor(Math.random() * 14),
                totalSessions: Math.floor(Math.random() * 8) + 1,
            };

            const { html, text } = buildWeeklySummaryEmail(summary);
            await sendMail(user.email, "Your Weekly TrichMind Summary 🌼", html, text);

            logger.info(`📧 Sent weekly summary to ${user.email}`);
        }

        res.json({ ok: true, message: `Sent ${users.length} summaries` });
    } catch (err: any) {
        logger.error(`❌ Weekly summary error: ${err.message}`);
        res.status(500).json({ error: "Failed to send summaries" });
    }
};
