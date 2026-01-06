// server/src/controllers/dailyProgressController.ts

import { z } from "zod";
import type { Response } from "express";
import type { AuthRequest } from "../middlewares";
import { asyncHandler } from "../utils";
import { DailyCheckIn } from "../models";


/**-----------------
    Date helpers
--------------------*/
function dayKeyFromInput(input?: string): string {
    // If input is "YYYY-MM-DD", keep it
    if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

    // If input is ISO/date string, convert to YYYY-MM-DD (UTC)
    if (typeof input === "string" && input.trim().length > 0) {
        const d = new Date(input);
        if (!Number.isFinite(d.getTime())) throw new Error("Invalid date");
        return d.toISOString().slice(0, 10);
    }

    // Default = today (UTC)
    return new Date().toISOString().slice(0, 10);
}

function utcDateFromDayKey(day: string): Date {
    // day: YYYY-MM-DD
    const [y, m, d] = day.split("-").map((n) => Number(n));
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0)); // midday avoids DST edge cases
}

function diffDays(a: string, b: string): number {
    const ta = utcDateFromDayKey(a).getTime();
    const tb = utcDateFromDayKey(b).getTime();
    return Math.round((tb - ta) / 86_400_000);
}

/** -----------------------
 * Schemas
 * ---------------------- */
const CheckInSchema = z
    .object({
        relapsed: z.boolean(),
        date: z.string().optional(),
        note: z.string().trim().max(500).optional(),
    })
    .strict();

/** -----------------------
 * GET /api/progress/daily?limit=60
 * ---------------------- */
export const getDaily = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const limitRaw = req.query.limit;
    const limitNum = typeof limitRaw === "string" ? Number(limitRaw) : 60;
    const limit = Number.isFinite(limitNum) ? Math.min(Math.max(1, limitNum), 365) : 60;

    const items = await DailyCheckIn.find({ userId })
        .sort({ day: -1 })
        .limit(limit)
        .lean();

    return res.json({ ok: true, items });
});

/** -----------------------
 * POST /api/progress/daily/checkin
 * body: { relapsed: boolean, date?: string, note?: string }
 * ---------------------- */
export const checkInDaily = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const parsed = CheckInSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "ValidationError", issues: parsed.error.flatten() });
    }

    const { relapsed, date, note } = parsed.data;
    const day = dayKeyFromInput(date);

    // upsert so the user can re-checkin/update the same day
    const entry = await DailyCheckIn.findOneAndUpdate(
        { userId, day },
        { $set: { relapsed, ...(note ? { note } : {}) } },
        { new: true, upsert: true }
    ).lean();

    return res.status(201).json({ ok: true, entry });
});

/** -----------------------
 * GET /api/progress/daily/summary
 * returns:
 *  currentStreak, previousStreak, longestStreak, relapseCount, lastEntryDate, lastRelapseDate, last14
 * ---------------------- */
export const getDailySummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Pull enough history to compute streaks accurately
    const all = await DailyCheckIn.find({ userId }).sort({ day: 1 }).lean();

    if (!all.length) {
        return res.json({
            currentStreak: 0,
            previousStreak: 0,
            longestStreak: 0,
            relapseCount: 0,
            lastEntryDate: null,
            lastRelapseDate: null,
            last14: [],
        });
    }

    const lastEntry = all[all.length - 1];
    const lastEntryDate = lastEntry.day;

    const relapseCount = all.reduce((acc, x) => acc + (x.relapsed ? 1 : 0), 0);
    const lastRelapse = [...all].reverse().find((x) => x.relapsed);
    const lastRelapseDate = lastRelapse ? lastRelapse.day : null;

    // Compute streak runs (missing day breaks streak)
    let longestStreak = 0;
    let currentRun = 0;

    // Store run lengths ending at each index to derive previous streak
    const runEnd: number[] = new Array(all.length).fill(0);

    for (let i = 0; i < all.length; i++) {
        const cur = all[i];
        const prev = i > 0 ? all[i - 1] : null;

        const isConsecutive = prev ? diffDays(prev.day, cur.day) === 1 : true;

        if (cur.relapsed) {
            currentRun = 0;
            runEnd[i] = 0;
            continue;
        }

        if (!prev || !isConsecutive || prev.relapsed) {
            currentRun = 1;
        } else {
            currentRun += 1;
        }

        runEnd[i] = currentRun;
        if (currentRun > longestStreak) longestStreak = currentRun;
    }

    const latestRun = runEnd[all.length - 1];
    const currentStreak = lastEntry.relapsed ? 0 : latestRun;

    // previousStreak = streak run immediately before the last relapse entry (if any)
    let previousStreak = 0;
    if (lastRelapse) {
        const idx = all.findIndex((x) => x.day === lastRelapse.day);
        // look backwards for the run that ended before relapse day
        if (idx > 0) previousStreak = runEnd[idx - 1] ?? 0;
    } else {
        // never relapsed -> previous = 0 (or could equal current)
        previousStreak = 0;
    }

    const last14 = all.slice(-14).map((x) => ({ day: x.day, relapsed: !!x.relapsed }));

    return res.json({
        currentStreak,
        previousStreak,
        longestStreak,
        relapseCount,
        lastEntryDate,
        lastRelapseDate,
        last14,
    });
});
