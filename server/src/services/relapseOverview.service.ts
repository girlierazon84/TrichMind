// server/src/services/relapseOverview.service.ts

import type { Types } from "mongoose";
import { JournalEntry, HealthLog, User } from "../models";
import { logger } from "../utils";
import {
    predictRelapseRisk,
    type MlRelapseResponse,
} from "../services";
import type { RelapseFeaturesExtended } from "../types/relapseFeatures";


// Tunable thresholds for "enough data"
const MIN_JOURNAL_FOR_RISK = 5;
const MIN_HEALTH_FOR_RISK = 3;

// Small helper to avoid NaN
const safeDiv = (num: number, den: number): number =>
    den > 0 ? num / den : 0;

// Lean types from Mongo
interface JournalLean {
    urgeIntensity?: number;
    createdAt?: Date | string;
    mood?: string;
    preUrgeTriggers?: string[];
}

interface HealthLean {
    sleepHours?: number;
    stressLevel?: number;
    exerciseMinutes?: number;
    date?: Date | string;
}

interface UserProfileLean {
    age?: number;
    age_of_onset?: number;
    years_since_onset?: number;

    pulling_severity?: number;
    pulling_frequency?: string;
    pulling_awareness?: string;
    successfully_stopped?: string | boolean;

    how_long_stopped_days?: number;
    how_long_stopped_days_est?: number;

    emotion?: string;

    coping_worked?: string[];
    coping_not_worked?: string[];
}

interface StreakInfo {
    current: number;
    previous: number;
}

// Shape returned to frontend
export interface RelapseSummary {
    risk_bucket: "low" | "medium" | "high";
    risk_score: number; // 0–1
    confidence: number; // 0–1
    model_version?: string;
}

export interface RiskHistoryPoint {
    date: string;
    score: number; // 0–1
}

export interface RelapseOverviewResult {
    ok: boolean;
    enoughData: boolean;
    relapseSummary: RelapseSummary | null;
    riskHistory: RiskHistoryPoint[];
    streak: {
        current: number;
        previous: number;
    };
    coping: {
        worked: string[];
        notWorked: string[];
    };
    dataCounts: {
        journalEntries: number;
        healthLogs: number;
        minJournalNeeded: number;
        minHealthNeeded: number;
    };
}

/**------------------------------------------------------------
    Temporary streak helper.
    TODO: replace with your real streak service when ready.
---------------------------------------------------------------*/
async function getSoberStreakForUser(
    _userId: Types.ObjectId | string
): Promise<StreakInfo> {
    // For now we just return 0/0 – keeps API shape correct
    return { current: 0, previous: 0 };
}

/**----------------------------------------
    Build extended feature vector from:
        - profile
        - journal aggregates
        - health aggregates
-------------------------------------------*/
function buildExtendedFeatures(
    // Core profile fields
    user: UserProfileLean,
    journal: JournalLean[],
    health: HealthLean[]
): RelapseFeaturesExtended | null {
    // Core profile fields
    const {
        age,
        age_of_onset,
        years_since_onset,
        pulling_severity,
        pulling_frequency,
        pulling_awareness,
        successfully_stopped,
        emotion,
    } = user as any;

    // Days stopped: check est → raw → 0
    const rawDaysStopped = (user as any).how_long_stopped_days;
    const rawDaysStoppedEst = (user as any).how_long_stopped_days_est;

    // Days stopped: check est → raw → 0
    const hasDaysStopped =
        typeof rawDaysStopped === "number" ||
        typeof rawDaysStoppedEst === "number";

    // Basic validation – if core fields are missing, bail out
    if (
        typeof age !== "number" ||
        typeof age_of_onset !== "number" ||
        typeof pulling_severity !== "number" ||
        !hasDaysStopped ||
        typeof emotion !== "string" ||
        typeof successfully_stopped === "undefined"
    ) {
        return null;
    }

    // Fallback for years_since_onset
    const yso =
        typeof years_since_onset === "number"
            ? years_since_onset
            : age - age_of_onset;

    // Days stopped: check est → raw → 0
    const daysStopped =
        typeof rawDaysStoppedEst === "number"
            ? rawDaysStoppedEst
            : typeof rawDaysStopped === "number"
            ? rawDaysStopped
            : 0;

    // Journal aggregates
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    // Journal aggregates - filter valid urge entries
    const withUrge = journal.filter(
        (j) => typeof j.urgeIntensity === "number" && j.createdAt
    );

    // Journal aggregates - last entry date
    const lastEntryDate = withUrge[0]?.createdAt
        ? new Date(withUrge[0].createdAt as string | Date)
        : null;

    // Days since last journal entry
    const days_since_last_entry = lastEntryDate
        ? Math.round((now - lastEntryDate.getTime()) / msPerDay)
        : 999;

    // Journal aggregates - filter entries within given days
    const inDays = (days: number) =>
        withUrge.filter((j) => {
            const ts = new Date(j.createdAt as any).getTime();
            return now - ts <= days * msPerDay;
        });

    // Journal aggregates - last 7 and 30 days
    const j7 = inDays(7);
    const j30 = inDays(30);

    // Journal aggregates - sum urge intensity
    const sumUrge = (arr: JournalLean[]) =>
        arr.reduce((sum, j) => sum + (j.urgeIntensity ?? 0), 0);

    // Journal aggregates - average and max urge intensity
    const avg_urge_7d = safeDiv(sumUrge(j7), j7.length);
    const avg_urge_30d = safeDiv(sumUrge(j30), j30.length);
    const max_urge_7d = j7.reduce(
        (max, j) => Math.max(max, j.urgeIntensity ?? 0),
        0
    );
    // Journal aggregates - high urge events (7+ intensity) in last 7 days
    const high_urge_events_7d = j7.filter(
        (j) => (j.urgeIntensity ?? 0) >= 7
    ).length;

    // Journal aggregates - number of journal entries in last 7 and 30 days
    const num_journal_entries_7d = j7.length;
    const num_journal_entries_30d = j30.length;

    // Mood buckets for last 30 days
    const STRESS_MOODS = [
        "Sad",
        "Anxious",
        "Stressed",
        "Overwhelmed",
        "Angry",
        "Bored",
    ];
    // Mood buckets for last 30 days - calm moods & happy moods
    const CALM_MOODS = ["Calm", "Tired", "Neutral"];
    const HAPPY_MOODS = ["Happy", "Proud", "Hopeful"];

    // Mood counts for last 30 days- total mood count & specific mood counts
    const totalMoodCount = j30.filter((j) => !!j.mood).length;
    const stressMoodCount = j30.filter((j) =>
        STRESS_MOODS.includes((j.mood as any) || "")
    ).length;
    const calmMoodCount = j30.filter((j) =>
        CALM_MOODS.includes((j.mood as any) || "")
    ).length;
    const happyMoodCount = j30.filter((j) =>
        HAPPY_MOODS.includes((j.mood as any) || "")
    ).length;

    // Mood percentages for last 30 days
    const pct_stress_moods_30d = safeDiv(stressMoodCount, totalMoodCount);
    const pct_calm_moods_30d = safeDiv(calmMoodCount, totalMoodCount);
    const pct_happy_moods_30d = safeDiv(happyMoodCount, totalMoodCount);

    // Triggers for last 30 days
    const triggerCounts = {
        Stress: 0,
        Boredom: 0,
        Anxiety: 0,
        Fatigue: 0,
        BodyFocus: 0,
        ScreenTime: 0,
        Social: 0,
        Other: 0,
    };

    // Triggers for last 30 days - count occurrences
    j30.forEach((j) => {
        const triggers = (j as any).preUrgeTriggers as string[] | undefined;
        if (!Array.isArray(triggers)) return;
        triggers.forEach((t) => {
            const key = t.trim();
            if (key in triggerCounts) {
                (triggerCounts as any)[key] += 1;
            }
        });
    });

    // Health aggregates
    const validHealth = health.filter(
        (h) =>
            typeof h.sleepHours === "number" &&
            typeof h.stressLevel === "number" &&
            typeof h.exerciseMinutes === "number" &&
            h.date
    ) as Array<
        HealthLean & {
            sleepHours: number;
            stressLevel: number;
            exerciseMinutes: number;
            date: string | Date;
        }
    >;

    // Days since last health log - get most recent date
    const lastHealthDate = validHealth[0]?.date
        ? new Date(validHealth[0].date)
        : null;

    // Days since last health log - compute days difference
    const days_since_last_health_log = lastHealthDate
        ? Math.round((now - lastHealthDate.getTime()) / msPerDay)
        : 999;

    // Health aggregates - filter entries within given days
    const hInDays = (days: number) =>
        validHealth.filter((h) => {
            const ts = new Date(h.date).getTime();
            return now - ts <= days * msPerDay;
        });

    // Health aggregates - last 7 and 30 days
    const h7 = hInDays(7);
    const h30 = hInDays(30);

    // Health aggregates - sum by key helper
    const sumBy = (
        arr: typeof validHealth,
        key: "sleepHours" | "stressLevel" | "exerciseMinutes"
    ) => arr.reduce((sum, h) => sum + (h[key] ?? 0), 0);

    // Health aggregates - sleep
    const avg_sleep_7d = safeDiv(sumBy(h7, "sleepHours"), h7.length);
    const avg_sleep_30d = safeDiv(sumBy(h30, "sleepHours"), h30.length);
    const min_sleep_7d =
        h7.reduce((min, h) => Math.min(min, h.sleepHours ?? 999), 999) === 999
            ? 0
            : h7.reduce(
                    (min, h) => Math.min(min, h.sleepHours ?? 999),
                    999
                );

    // Health aggregates - short sleep nights (<6 hours) in last 7 days
    const short_sleep_nights_7d = h7.filter(
        (h) => (h.sleepHours ?? 0) < 6
    ).length;

    // Health aggregates - stress
    const avg_health_stress_7d = safeDiv(sumBy(h7, "stressLevel"), h7.length);
    const avg_health_stress_30d = safeDiv(
        sumBy(h30, "stressLevel"),
        h30.length
    );
    // Health aggregates - max stress level in last 7 days
    const max_health_stress_7d = h7.reduce(
        (max, h) => Math.max(max, h.stressLevel ?? 0),
        0
    );
    // Health aggregates - high stress days (7+ level) in last 7 days
    const high_stress_days_7d = h7.filter(
        (h) => (h.stressLevel ?? 0) >= 7
    ).length;

    // Health aggregates - exercise
    const avg_exercise_7d = safeDiv(sumBy(h7, "exerciseMinutes"), h7.length);
    const avg_exercise_30d = safeDiv(
        sumBy(h30, "exerciseMinutes"),
        h30.length
    );
    // Health aggregates - days with any exercise in last 7 days
    const days_with_any_exercise_7d = h7.filter(
        (h) => (h.exerciseMinutes ?? 0) > 0
    ).length;

    // Health aggregates - number of health logs in last 7 and 30 days
    const num_health_logs_7d = h7.length;
    const num_health_logs_30d = h30.length;

    // Combined: high urge & high stress (7d)
    const high_urge_and_high_stress_days_7d = j7.filter((j) => {
        const urge = j.urgeIntensity ?? 0;
        if (urge < 7) return false;

        // Find corresponding health log for same day
        const dateJ = j.createdAt ? new Date(j.createdAt as any) : null;
        if (!dateJ) return false;

        // Look for health log on same date
        const sameDayHealth = h7.find((h) => {
            const dh = new Date(h.date);
            return (
                dh.getFullYear() === dateJ.getFullYear() &&
                dh.getMonth() === dateJ.getMonth() &&
                dh.getDate() === dateJ.getDate()
            );
        });

        return sameDayHealth ? (sameDayHealth.stressLevel ?? 0) >= 7 : false;
    }).length;

    // Final feature object (extended)
    const base: RelapseFeaturesExtended = {
        age,
        age_of_onset,
        years_since_onset: Math.max(yso, 0),

        pulling_severity,
        pulling_frequency: pulling_frequency ?? "unknown",
        pulling_awareness: pulling_awareness ?? "unknown",
        successfully_stopped,
        how_long_stopped_days: daysStopped,
        emotion: (emotion?.trim() || "neutral") as string,

        // Journal – urges
        avg_urge_7d,
        avg_urge_30d,
        max_urge_7d,
        high_urge_events_7d,
        num_journal_entries_7d,
        num_journal_entries_30d,
        days_since_last_entry,

        // Journal – moods
        pct_stress_moods_30d,
        pct_calm_moods_30d,
        pct_happy_moods_30d,

        // Journal – triggers
        count_trigger_stress_30d: triggerCounts.Stress,
        count_trigger_boredom_30d: triggerCounts.Boredom,
        count_trigger_anxiety_30d: triggerCounts.Anxiety,
        count_trigger_fatigue_30d: triggerCounts.Fatigue,
        count_trigger_bodyfocus_30d: triggerCounts.BodyFocus,
        count_trigger_screentime_30d: triggerCounts.ScreenTime,
        count_trigger_social_30d: triggerCounts.Social,
        count_trigger_other_30d: triggerCounts.Other,

        // Health – sleep
        avg_sleep_7d,
        avg_sleep_30d,
        min_sleep_7d,
        short_sleep_nights_7d,

        // Health – stress
        avg_health_stress_7d,
        avg_health_stress_30d,
        max_health_stress_7d,
        high_stress_days_7d,

        // Health – exercise
        avg_exercise_7d,
        avg_exercise_30d,
        days_with_any_exercise_7d,
        num_health_logs_7d,
        num_health_logs_30d,
        days_since_last_health_log,

        // Combined
        high_urge_and_high_stress_days_7d,
    };

    return base;
}

/**-----------------------------------------------------------------------------
    Simple heuristic relapse-risk scoring (fallback when ML is unavailable).
    Uses profile fields + a bit of journal context.
--------------------------------------------------------------------------------*/
function computeHeuristicRisk(
    user: UserProfileLean,
    journal: JournalLean[]
): RelapseSummary {
    // Severity (0–10): default 0
    const severity =
        typeof user.pulling_severity === "number"
            ? user.pulling_severity
            : 0;

    // Days stopped: check est → raw → 0
    const daysStopped =
        typeof user.how_long_stopped_days_est === "number"
            ? user.how_long_stopped_days_est
            : typeof user.how_long_stopped_days === "number"
            ? user.how_long_stopped_days
            : 0;

    // Urge intensities from journal entries
    const urges: number[] = journal
        .filter((j) => typeof j.urgeIntensity === "number")
        .map((j) => j.urgeIntensity as number);

    // Average urge intensity from recent journal (0–10): default 0
    const avgUrge =
        urges.length > 0
            ? urges.reduce((sum, v) => sum + v, 0) / urges.length
            : 0;

    // Severity normalized to 0–1
    const severityNorm = Math.min(Math.max(severity / 10, 0), 1);
    // Average urge normalized to 0–1
    const avgUrgeNorm = Math.min(Math.max(avgUrge / 10, 0), 1);

    // If they've been stopped longer, gently reduce risk
    const stoppedBuffer = Math.min(daysStopped / 60, 1); // cap after ~2 months
    const stoppedPenalty = stoppedBuffer * 0.3;

    // Combine into overall risk score (0–1)
    let riskScore = severityNorm * 0.5 + avgUrgeNorm * 0.5 - stoppedPenalty;
    riskScore = Math.min(Math.max(riskScore, 0), 1);

    // Bucketize risk score into categories
    let bucket: "low" | "medium" | "high" = "low";
    if (riskScore >= 0.66) bucket = "high";
    else if (riskScore >= 0.33) bucket = "medium";

    // Confidence increases with amount of journal data (up to 10 entries)
    const confidence = 0.5 + 0.5 * Math.min(urges.length / 10, 1);

    return {
        risk_bucket: bucket,
        risk_score: riskScore,
        confidence: Math.min(Math.max(confidence, 0), 1),
        model_version: "heuristic-v2",
    };
}

/**---------------------------------------------------
    Main service: get relapse overview for a user.
------------------------------------------------------*/
export async function getRelapseOverviewForUser(
    userId: Types.ObjectId | string
): Promise<RelapseOverviewResult> {
    // 1) Load recent data
    const [journalRaw, healthRaw, userDocRaw] = await Promise.all([
        // JournalEntry has `userId`
        JournalEntry.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()
            .exec(),

        // HealthLog has `userId`
        HealthLog.find({ userId })
            .sort({ date: -1 })
            .limit(30)
            .lean()
            .exec(),

        // User fields that actually exist in UserModel
        User.findById(userId)
            .select(
                [
                    "age",
                    "age_of_onset",
                    "years_since_onset",
                    "pulling_severity",
                    "pulling_frequency",
                    "pulling_awareness",
                    "successfully_stopped",
                    "how_long_stopped_days",
                    "how_long_stopped_days_est",
                    "emotion",
                    "coping_worked",
                    "coping_not_worked",
                ].join(" ")
            )
            .lean()
            .exec(),
    ]);

    // Cast to lean types
    const journal = (journalRaw ?? []) as JournalLean[];
    const health = (healthRaw ?? []) as HealthLean[];
    const userDoc = (userDocRaw ?? null) as UserProfileLean | null;

    // Counts for data availability
    const journalCount = journal.length;
    const healthCount = health.length;

    // 2) Sober streak (placeholder)
    const streak = await getSoberStreakForUser(userId);

    // Do we have profile + extended features for ML?
    const features = userDoc
        ? buildExtendedFeatures(userDoc, journal, health)
        : null;
    const hasProfileFeatures = !!features;

    // Require both profile + a minimum of journal/health data
    const enoughData =
        hasProfileFeatures &&
        journalCount >= MIN_JOURNAL_FOR_RISK &&
        healthCount >= MIN_HEALTH_FOR_RISK;

    // 3) Compute relapse risk summary + history
    let relapseSummary: RelapseSummary | null = null;
    let riskHistory: RiskHistoryPoint[] = [];

    // If we have enough data, proceed
    if (enoughData && features) {
        // Try ML service first; fall back to heuristic on error
        let mlResp: MlRelapseResponse | null = null;

        // Attempt ML prediction
        try {
            mlResp = await predictRelapseRisk(features);
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            logger.warn(
                `⚠️ ML relapse-risk service failed, using heuristic: ${msg}`
            );
        }

        // If ML prediction failed, use heuristic
        if (mlResp) {
            relapseSummary = {
                risk_bucket: mlResp.risk_bucket,
                risk_score: mlResp.risk_score,
                confidence: mlResp.confidence,
                model_version: mlResp.model_version ?? "ml-api",
            };
        } else {
            relapseSummary = computeHeuristicRisk(userDoc ?? {}, journal);
        }

        // Simple history from journal urgeIntensity (0–10 → 0–1)
        riskHistory = journal
            .filter(
                (
                    j
                ): j is Required<
                    Pick<JournalLean, "urgeIntensity" | "createdAt">
                > => typeof j.urgeIntensity === "number" && !!j.createdAt
            )
            .slice()
            .reverse()
            .map((j) => ({
                date: new Date(j.createdAt as Date | string).toISOString(),
                score: (j.urgeIntensity as number) / 10,
            }))
            .slice(0, 20);
    }

    return {
        ok: true,
        enoughData,
        relapseSummary,
        riskHistory,
        streak: {
            current: streak.current ?? 0,
            previous: streak.previous ?? 0,
        },
        coping: {
            worked: userDoc?.coping_worked ?? [],
            notWorked: userDoc?.coping_not_worked ?? [],
        },
        dataCounts: {
            journalEntries: journalCount,
            healthLogs: healthCount,
            minJournalNeeded: MIN_JOURNAL_FOR_RISK,
            minHealthNeeded: MIN_HEALTH_FOR_RISK,
        },
    };
}
