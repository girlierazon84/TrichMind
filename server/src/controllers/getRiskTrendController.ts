// server/src/controllers/getRiskTrendController.ts

import { Request, Response } from "express";
import { HealthLog } from "../models";

/**------------------------------------------------
    🚨 Get Risk Trend Controller
    Fetches user's relapse risk trend over time.
---------------------------------------------------**/
export const getRiskTrend = async (req: Request, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });

        const logs = await HealthLog.find({ userId })
            .sort({ date: 1 })
            .lean();

        const trend = logs.map((log) => ({
            date:
                log.date instanceof Date
                    ? log.date.toISOString()
                    : String(log.date),
            score: log.relapseRisk?.score ?? 0,
        }));

        res.json({ trend });
    } catch (error) {
        console.error("getRiskTrend error:", error);
        res.status(500).json({ error: "Failed to fetch risk trend" });
    }
};

export default getRiskTrend;
