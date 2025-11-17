// server/src/controllers/healthTrend.ts

import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { get } from "axios";


// ──────────────────────────────
// Types
// ──────────────────────────────
export interface RiskTrendPoint {
    createdAt: Date;
    risk_score: number;
}

// ──────────────────────────────
// Controller: Get Risk Trend
// ──────────────────────────────
export const getRiskTrend = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const logs: RiskTrendPoint[] = await prisma.healthLog.findMany({
            where: { userId },
            select: {
                createdAt: true,
                risk_score: true,
            },
            orderBy: { createdAt: "asc" },
        });

        const trend = logs.map((log) => ({
            date: log.createdAt.toISOString(),
            score: log.risk_score,
        }));

        return res.json({ trend });

    } catch (error) {
        console.error("getRiskTrend error:", error);
        return res.status(500).json({ error: "Failed to fetch risk trend" });
    }
};


export default getRiskTrend;