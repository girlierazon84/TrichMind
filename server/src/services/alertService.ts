// server/src/services/alertService.ts

import { User, AlertLog } from "../models";
import { ENV } from "../config";
import { sendMail } from "../utils";
import { buildRelapseAlertEmail } from "../templates";
import { loggerService } from "./loggerService";


/**------------------------------------------------------------------------------
    Alert Service
    Handles sending relapse risk alert emails to users based on their scores.
---------------------------------------------------------------------------------*/
export const alertService = {
    // Sends a relapse alert email if the user's score exceeds the defined threshold.
    async sendRelapseAlert(userId: string, score: number) {
        // fetch user
        const user = await User.findById(userId).select("email displayName").lean();
        // user must exist
        if (!user) throw new Error("User not found");
        // determine threshold
        const thresholdRaw = Number(ENV.RELAPSE_ALERT_THRESHOLD ?? 0.7);
        const threshold = Number.isFinite(thresholdRaw) ? thresholdRaw : 0.7;
        // check score against threshold
        if (score < threshold) {
            // record non-send
            void loggerService.logInfo(
                "Score below alert threshold",
                { userId, score, threshold },
                "alert",
                userId
            );
            return { sent: false, message: "Below threshold" };
        }

        // ✅ templates are object-args
        const dashboardUrl = `${(ENV.CLIENT_URL ?? process.env.CLIENT_URL ?? "").replace(/\/$/, "")}/dashboard`;
        const { html, text } = buildRelapseAlertEmail({
            displayName: user.displayName,
            score,
            dashboardUrl,
        });

        // ✅ mailer is object-args
        const mailRes = await sendMail({
            to: user.email,
            subject: "⚠️ Elevated Relapse Risk",
            html,
            text,
            softFail: true,
        });

        // handle mail failure
        if (!mailRes.ok) {
            // record failure
            const msg =
                (mailRes as any)?.error ??
                (mailRes as any)?.reason ??
                "Failed to send relapse alert email";

            // log alert failure
            await AlertLog.create({
                userId,
                score,
                sent: false,
                email: user.email,
                error: String(msg),
                triggeredAt: new Date(),
            });

            // log error
            void loggerService.logError(
                "Relapse alert send failed",
                { userId, email: user.email, score, error: String(msg) },
                "alert",
                userId
            );

            // throw error
            throw new Error("Failed to send relapse alert email");
        }

        // record success
        await AlertLog.create({
            userId,
            score,
            sent: true,
            email: user.email,
            triggeredAt: new Date(),
        });

        // log success
        void loggerService.logInfo(
            "Relapse alert sent",
            { userId, email: user.email, score, threshold },
            "alert",
            userId
        );

        // return success
        return { sent: true, message: "Alert email sent" };
    },
};

export default alertService;
