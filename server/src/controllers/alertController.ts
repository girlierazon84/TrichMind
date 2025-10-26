// server/src/controllers/alertController.ts
import { Request, Response } from "express";
import User from "../models/User";
import AlertLog from "../models/AlertLog";
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

        // ✅ Fix: Ensure threshold is parsed safely as a number
        const threshold = Number(ENV.RELAPSE_ALERT_THRESHOLD ?? 0.7);

        if (isNaN(threshold)) {
            logger.warn("⚠️ Invalid RELAPSE_ALERT_THRESHOLD in environment, defaulting to 0.7");
        }

        const finalThreshold = isNaN(threshold) ? 0.7 : threshold;

        if (score < finalThreshold) {
            logger.info(`⚙️ Score below threshold (${score.toFixed(2)} < ${finalThreshold}), no alert sent.`);
            return res.json({ ok: true, message: "No alert triggered (below threshold)" });
        }

        const { html, text } = buildRelapseAlertEmail(user.displayName, score);
        await sendMail(user.email, "⚠️ Elevated Relapse Risk", html, text);

        await AlertLog.create({
            userId,
            score,
            sent: true,
            email: user.email,
        });

        logger.info(`📧 Sent relapse alert to ${user.email} (score=${score.toFixed(2)})`);
        res.json({ ok: true, message: "Alert email sent successfully" });
    } catch (err: any) {
        logger.error(`❌ Relapse alert error: ${err.message}`);
        await AlertLog.create({
            userId: req.body.userId,
            score: req.body.score,
            sent: false,
            error: err.message,
        });
        res.status(500).json({ error: "Failed to send relapse alert" });
    }
};
