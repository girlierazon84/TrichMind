// server/src/services/summaryService.ts

import { User, SummaryLog } from "../models";
import { sendMail } from "../utils";
import { buildWeeklySummaryEmail } from "../templates";
import { loggerService } from "./loggerService";


// Helper to construct dashboard URL
function getDashboardUrl() {
    // Ensure no trailing slash
    const base = (process.env.CLIENT_URL ?? "").replace(/\/$/, "");
    return `${base}/dashboard`;
}

// Service to handle summary-related operations
export const summaryService = {
    // Send weekly summaries to all users
    async sendWeeklySummaries() {
        // Track success and failure counts
        let successCount = 0;
        let failedCount = 0;

        // Fetch all users with necessary fields
        const users = await User.find({}, "email displayName").lean();

        // If no users found, log warning and exit
        if (!users.length) {
            // Log a warning if no users are found
            void loggerService.logWarning("No users found for weekly summary", {}, "summary");
            return { ok: true, message: "No users found", successCount: 0, failedCount: 0 };
        }

        // Current week timestamp
        const weekOf = new Date();
        const dashboardUrl = getDashboardUrl();

        // Iterate over each user to send summaries
        for (const user of users) {
            // Wrap in try-catch to handle individual user errors
            try {
                // Keep email payload separate (template requires dashboardUrl)
                const summaryForEmail = {
                    displayName: user.displayName,
                    avgRisk: Math.random() * 0.5 + 0.2,
                    topCoping: "Deep Breathing",
                    streakDays: Math.floor(Math.random() * 14),
                    totalSessions: Math.floor(Math.random() * 8) + 1,
                    dashboardUrl,
                };

                // ✅ only DB-safe fields (no dashboardUrl)
                const summaryForDb = {
                    // Fields to store in DB
                    avgRisk: summaryForEmail.avgRisk,
                    topCoping: summaryForEmail.topCoping,
                    streakDays: summaryForEmail.streakDays,
                    totalSessions: summaryForEmail.totalSessions,
                };

                // Build email content
                const { html, text } = buildWeeklySummaryEmail(summaryForEmail);

                // Send the email
                const mailRes = await sendMail({
                    to: user.email,
                    subject: "Your Weekly TrichMind Summary 🌼",
                    html,
                    text,
                    softFail: true,
                });

                // Handle email sending failure
                if (!mailRes.ok) {
                    // Extract error message
                    const msg =
                        (mailRes as any)?.error ??
                        (mailRes as any)?.reason ??
                        "sendMail failed";

                    // Increment failure count
                    failedCount++;

                    // Log failure in SummaryLog
                    await SummaryLog.create({
                        userId: user._id as any,
                        weekOf,
                        ...summaryForDb,
                        sentAt: new Date(),
                        status: "failed",
                        error: String(msg),
                    });

                    // Log the error
                    void loggerService.logError(
                        "Weekly summary failed",
                        { email: user.email, error: String(msg) },
                        "summary",
                        String(user._id)
                    );

                    // Skip to next user
                    continue;
                }

                // Log success in SummaryLog
                await SummaryLog.create({
                    userId: user._id as any,
                    weekOf,
                    ...summaryForDb,
                    sentAt: new Date(),
                    status: "sent",
                });

                // Increment success count
                successCount++;

                // Log the success
                void loggerService.logInfo(
                    "Weekly summary sent",
                    { email: user.email },
                    "summary",
                    String(user._id)
                );
            } catch (e: any) {
                // Increment failure count
                failedCount++;

                // Log failure in SummaryLog
                await SummaryLog.create({
                    userId: user._id as any,
                    weekOf,
                    sentAt: new Date(),
                    status: "failed",
                    error: e?.message ?? String(e),
                });

                // Log the error
                void loggerService.logError(
                    "Weekly summary failed",
                    { email: user.email, error: e?.message ?? String(e) },
                    "summary",
                    String(user._id)
                );
            }
        }

        // Return summary of the operation
        return {
            ok: true,
            message: `Sent ${successCount} summaries successfully (${failedCount} failed)`,
            successCount,
            failedCount,
        };
    },
};

export default summaryService;
