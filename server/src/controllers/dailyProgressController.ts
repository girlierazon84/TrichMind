// server/src/controllers/dailyProgressController.ts

import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import type { AuthRequest } from "../middlewares";
import { DailyCheckIn } from "../models";


const APP_TIMEZONE = process.env.APP_TIMEZONE || "Europe/Stockholm";

/**--------------------------
    Date helpers (stable)
-----------------------------*/

// "YYYY-MM-DD" for today in configured timezone
function todayKey(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

function isDayKey(s: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Parse YYYY-MM-DD as UTC midday to avoid DST shifts
function parseDayUTC(day: string): Date | null {
    if (!isDayKey(day)) return null;
    const [y, m, d] = day.split("-").map((x) => Number(x));
    if (![y, m, d].every(Number.isFinite)) return null;
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function formatDayUTC(dt: Date): string {
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dt.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function addDaysUTC(day: string, delta: number): string | null {
    const dt = parseDayUTC(day);
    if (!dt) return null;
    dt.setUTCDate(dt.getUTCDate() + delta);
    return formatDayUTC(dt);
}

/** -------------------------
 * Schemas
 * ------------------------- */
const CheckInSchema = z
    .object({
        relapsed: z.boolean(),
        date: z.string().trim().optional(), // optional YYYY-MM-DD
        note: z.string().trim().max(500).optional(),
    })
    .strict();

const GetDailySchema = z
    .object({
        days: z.coerce.number().min(1).max(365).optional(),
    })
    .strict();

/** -------------------------
 * Controllers
 * ------------------------- */

// POST /api/progress/daily/checkin
export async function postDailyCheckIn(req: AuthRequest, res: Response) {
    const userIdRaw = req.auth?.userId;
    if (!userIdRaw) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const parsed = CheckInSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "ValidationError", issues: parsed.error.flatten() });
    }

    const userId = new mongoose.Types.ObjectId(userIdRaw);

    const day =
        parsed.data.date && isDayKey(parsed.data.date) ? parsed.data.date : todayKey();

    const update = {
        userId,
        day,
        relapsed: parsed.data.relapsed,
        note: parsed.data.note,
    };

    const saved = await DailyCheckIn.findOneAndUpdate(
        { userId, day },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ ok: true, entry: saved });
}

// GET /api/progress/daily?days=30
export async function getDailyEntries(req: AuthRequest, res: Response) {
    const userIdRaw = req.auth?.userId;
    if (!userIdRaw) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const parsed = GetDailySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "ValidationError", issues: parsed.error.flatten() });
    }

    const days = parsed.data.days ?? 30;
    const userId = new mongoose.Types.ObjectId(userIdRaw);

    const entries = await DailyCheckIn.find({ userId })
        .sort({ day: -1 })
        .limit(days)
        .lean();

    // return chronological (oldest -> newest) for UI consistency
    entries.reverse();

    return res.json({ ok: true, entries });
}

// GET /api/progress/daily/summary
export async function getDailySummary(req: AuthRequest, res: Response) {
    const userIdRaw = req.auth?.userId;
    if (!userIdRaw) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const userId = new mongoose.Types.ObjectId(userIdRaw);

    // Load enough history for streak + longest streak
    const entries = await DailyCheckIn.find({ userId })
        .sort({ day: 1 }) // chronological
        .lean();

    if (!entries.length) {
        return res.json({
            ok: true,
            currentStreak: 0,
            previousStreak: 0,
            longestStreak: 0,
            relapseCount: 0,
            lastEntryDate: null,
            lastRelapseDate: null,
            last14: [],
        });
    }

    // Map by day for quick lookup
    const byDay = new Map<string, { day: string; relapsed: boolean }>();
    for (const e of entries) {
        if (typeof e.day === "string") byDay.set(e.day, { day: e.day, relapsed: !!e.relapsed });
    }

    const lastEntry = entries[entries.length - 1];
    const lastEntryDate = lastEntry.day ?? null;

    const relapseCount = entries.reduce((acc, e) => acc + (e.relapsed ? 1 : 0), 0);
    const lastRelapse = [...entries].reverse().find((e) => e.relapsed);
    const lastRelapseDate = lastRelapse?.day ?? null;

    // Longest streak: consecutive *checked-in* sober days
    let longestStreak = 0;
    let running = 0;
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (e.relapsed) {
            running = 0;
            continue;
        }

        // consecutive day check (requires no gap)
        if (i === 0) {
            running = 1;
        } else {
            const prevDay = entries[i - 1].day;
            const expected = prevDay ? addDaysUTC(prevDay, 1) : null;
            if (expected && e.day === expected && !entries[i - 1].relapsed) {
                running += 1;
            } else {
                running = 1;
            }
        }
        if (running > longestStreak) longestStreak = running;
    }

    // Current streak: count backwards from latest entry if latest is sober
    let currentStreak = 0;
    if (lastEntryDate && !lastEntry.relapsed) {
        let cursor = lastEntryDate;
        while (true) {
            const row = byDay.get(cursor);
            if (!row || row.relapsed) break;
            currentStreak += 1;
            const prev = addDaysUTC(cursor, -1);
            if (!prev) break;
            cursor = prev;
        }
    }

    // Previous streak: streak immediately before the most recent relapse day
    let previousStreak = 0;
    if (lastRelapseDate) {
        const dayBefore = addDaysUTC(lastRelapseDate, -1);
        if (dayBefore) {
            let cursor = dayBefore;
            while (true) {
                const row = byDay.get(cursor);
                if (!row || row.relapsed) break;
                previousStreak += 1;
                const prev = addDaysUTC(cursor, -1);
                if (!prev) break;
                cursor = prev;
            }
        }
    }

    // last 14 entries (chronological)
    const last14 = entries.slice(-14).map((e) => ({ day: e.day, relapsed: !!e.relapsed }));

    return res.json({
        ok: true,
        currentStreak,
        previousStreak,
        longestStreak,
        relapseCount,
        lastEntryDate,
        lastRelapseDate,
        last14,
    });
}
