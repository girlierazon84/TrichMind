// server/src/services/alertService.ts

import { User, AlertLog } from "../models";
import { ENV } from "../config";
import { sendMail } from "../utils";
import { buildRelapseAlertEmail } from "../templates";
import { loggerService } from "./loggerService";

/**--------------------------------------------------------------------------
    Alert Service
    Handles sending relapse risk alert emails to users based on their scores.
-----------------------------------------------------------------------------**/
export const alertService = {
    async sendRelapseAlert(userId: string, score: number) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const threshold = Number(ENV.RELAPSE_ALERT_THRESHOLD ?? 0.7);
        const finalThreshold = isNaN(threshold) ? 0.7 : threshold;

        if (score < finalThreshold) {
            await loggerService.logInfo("Score below alert threshold", {
                userId,
                score,
            });
            return { sent: false, message: "Below threshold" };
        }

        const { html, text } = buildRelapseAlertEmail(
            user.displayName,
            score
        );
        await sendMail(
            user.email,
            "⚠️ Elevated Relapse Risk",
            html,
            text
        );

        await AlertLog.create({ userId, score, sent: true, email: user.email });
        await loggerService.logInfo("Relapse alert sent", {
            userId,
            email: user.email,
            score,
        });

        return { sent: true, message: "Alert email sent" };
    },
};

export default alertService;