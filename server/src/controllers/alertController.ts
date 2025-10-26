// server/src/controllers/alertController.ts
import { Request, Response } from "express";
import User from "../models/User";
import { ENV } from "../config/env";
import { buildRelapseAlertEmail } from "../templates/relapseAlertEmail";
import { sendMail } from "../utils/mailer";
import { logger } from "../utils/logger";

/**
 * Trigger relapse-risk alert email manually or via ML callback
 */
export const sendRelapseAlert = async (req: Request, res: Response) => {
    try {
        const { userId, score } = req.body;

        if (!userId || score === undefined) {
            return res.status(400).json({ error: "userId and score are required" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (score < ENV.RELAPSE_ALERT_THRESHOLD) {
            logger.info(`⚙️ Score below threshold (${score.toFixed(2)}), no alert sent.`);
            return res.json({ ok: true, message: "No alert triggered (below threshold)" });
        }

        const { html, text } = buildRelapseAlertEmail(user.displayName, score);
        await sendMail(user.email, "⚠️ TrichMind Insight: Elevated Relapse Risk", html, text);

        logger.info(`📧 Sent relapse alert to ${user.email} (score=${score.toFixed(2)})`);
        res.json({ ok: true, message: "Alert email sent successfully" });
    } catch (err: any) {
        logger.error(`❌ Relapse alert error: ${err.message}`);
        res.status(500).json({ error: "Failed to send relapse alert" });
    }
};
