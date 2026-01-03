// server/src/controllers/getRiskTrendController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { HealthLog } from "../models";


/**----------------------------------
    📈 Get Risk Trend Controller
-------------------------------------*/
export const getRiskTrend = asyncHandler(async (req: Request, res: Response) => {
    // Ensure user is authenticated
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Fetch health logs for the user, sorted by date
    const logs = await HealthLog.find({ userId }).sort({ date: 1 }).lean();

    // Map logs to extract date and relapse risk score
    const trend = logs.map((log: any) => ({
        date: log.date instanceof Date ? log.date.toISOString() : String(log.date),
        score: log.relapseRisk?.score ?? 0,
    }));

    // Respond with the risk trend data
    res.json({ ok: true, trend });
});

export default getRiskTrend;
