// server/src/services/relapseOverview.service.ts

import type { Types } from "mongoose";
import {
    JournalEntry,
    HealthLog,
    User,
    Predict
} from "../models";
import { loggerService } from "./loggerService";
import {
    predictRelapseOverviewRisk,
    type MlRelapseResponse
} from "./mlClient";
import type {
    RelapseFeaturesExtended
} from "../types/relapseFeatures";


// Minimum data requirements
const MIN_JOURNAL_FOR_RISK = 5;
const MIN_HEALTH_FOR_RISK = 3;

// Safe division helper
const safeDiv = (num: number, den: number): number => (den > 0 ? num / den : 0);

// Lean interfaces for fetched data
interface JournalLean {
    urgeIntensity?: number;
    createdAt?: Date | string;
    mood?: string;
    preUrgeTriggers?: string[];
}

// Health log lean interface
interface HealthLean {
    sleepHours?: number;
    stressLevel?: number;
    exerciseMinutes?: number;
    date?: Date | string;
}

// User profile lean interface
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

// Sober streak info
interface StreakInfo {
    current: number;
    previous: number;
}

// Relapse summary interface
export interface RelapseSummary {
    risk_bucket: "low" | "medium" | "high";
    risk_score: number;
    confidence: number;
    model_version?: string;
}

// Risk history point interface
export interface RiskHistoryPoint {
    date: string;
    score: number;
}

// Relapse overview result interface
export interface RelapseOverviewResult {
    ok: boolean;
    enoughData: boolean;
    relapseSummary: RelapseSummary | null;
    riskHistory: RiskHistoryPoint[];
    streak: { current: number; previous: number };
    coping: { worked: string[]; notWorked: string[] };
    dataCounts: {
        journalEntries: number;
        healthLogs: number;
        minJournalNeeded: number;
        minHealthNeeded: number;
    };
}

// Placeholder function to get sober streak; replace with real implementation
async function getSoberStreakForUser(_userId: Types.ObjectId | string): Promise<StreakInfo> {
    return { current: 0, previous: 0 };
}

// Build extended features from user, journal, and health data
function buildExtendedFeatures(
    user: UserProfileLean,
    journal: JournalLean[],
    health: HealthLean[]
): RelapseFeaturesExtended | null {
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

    // Extract days stopped
    const rawDaysStopped = (user as any).how_long_stopped_days;
    const rawDaysStoppedEst = (user as any).how_long_stopped_days_est;

    // Check required fields
    const hasDaysStopped =
        typeof rawDaysStopped === "number" || typeof rawDaysStoppedEst === "number";

    // Validate required numeric fields
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

    // Compute years since onset
    const yso =
        typeof years_since_onset === "number" ? years_since_onset : age - age_of_onset;

    // Determine days stopped
    const daysStopped =
        typeof rawDaysStoppedEst === "number"
            ? rawDaysStoppedEst
            : typeof rawDaysStopped === "number"
                ? rawDaysStopped
                : 0;

    // Current timestamp
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    // Ensure journal is sorted desc by createdAt already; same for health by date
    const withUrge = journal.filter((j) => typeof j.urgeIntensity === "number" && j.createdAt);

    // Last journal entry date
    const lastEntryDate =
        withUrge[0]?.createdAt ? new Date(withUrge[0].createdAt as any) : null;

    // Days since last journal entry
    const days_since_last_entry = lastEntryDate
        ? Math.round((now - lastEntryDate.getTime()) / msPerDay)
        : 999;

    // Filter journal entries within given days
    const inDays = (days: number) =>
        withUrge.filter((j) => {
            const ts = new Date(j.createdAt as any).getTime();
            return now - ts <= days * msPerDay;
        });

    // Journal entries in last 7 and 30 days
    const j7 = inDays(7);
    const j30 = inDays(30);

    // Sum urge helper
    const sumUrge = (arr: JournalLean[]) =>
        arr.reduce((sum, j) => sum + (j.urgeIntensity ?? 0), 0);

    // Compute urge stats
    const avg_urge_7d = safeDiv(sumUrge(j7), j7.length);
    const avg_urge_30d = safeDiv(sumUrge(j30), j30.length);

    // Max and high urge events in last 7 days
    const max_urge_7d = j7.reduce((max, j) => Math.max(max, j.urgeIntensity ?? 0), 0);
    const high_urge_events_7d = j7.filter((j) => (j.urgeIntensity ?? 0) >= 7).length;

    // Number of journal entries
    const num_journal_entries_7d = j7.length;
    const num_journal_entries_30d = j30.length;

    // Mood percentages in last 30 days
    const STRESS_MOODS = ["Sad", "Anxious", "Stressed", "Overwhelmed", "Angry", "Bored"];
    const CALM_MOODS = ["Calm", "Tired", "Neutral"];
    const HAPPY_MOODS = ["Happy", "Proud", "Hopeful"];

    // Compute mood counts
    const totalMoodCount = j30.filter((j) => !!j.mood).length;
    const stressMoodCount = j30.filter((j) => STRESS_MOODS.includes((j.mood as any) || "")).length;
    const calmMoodCount = j30.filter((j) => CALM_MOODS.includes((j.mood as any) || "")).length;
    const happyMoodCount = j30.filter((j) => HAPPY_MOODS.includes((j.mood as any) || "")).length;

    // Compute mood percentages
    const pct_stress_moods_30d = safeDiv(stressMoodCount, totalMoodCount);
    const pct_calm_moods_30d = safeDiv(calmMoodCount, totalMoodCount);
    const pct_happy_moods_30d = safeDiv(happyMoodCount, totalMoodCount);

    // Count pre-urge triggers in last 30 days
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

    // Tally triggers
    j30.forEach((j) => {
        // @ts-ignore
        const triggers = (j as any).preUrgeTriggers as string[] | undefined;
        if (!Array.isArray(triggers)) return;
        triggers.forEach((t) => {
            const key = t.trim();
            if (key in triggerCounts) (triggerCounts as any)[key] += 1;
        });
    });

    // Process health logs
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

    // Last health log date
    const lastHealthDate = validHealth[0]?.date ? new Date(validHealth[0].date) : null;

    // Days since last health log
    const days_since_last_health_log = lastHealthDate
        ? Math.round((now - lastHealthDate.getTime()) / msPerDay)
        : 999;

    // Filter health logs within given days
    const hInDays = (days: number) =>
        validHealth.filter((h) => {
            const ts = new Date(h.date).getTime();
            return now - ts <= days * msPerDay;
        });

    // Health logs in last 7 and 30 days
    const h7 = hInDays(7);
    const h30 = hInDays(30);

    // Helper to sum by key
    const sumBy = (
        arr: typeof validHealth,
        key: "sleepHours" | "stressLevel" | "exerciseMinutes"
    ) => arr.reduce((sum, h) => sum + (h[key] ?? 0), 0);

    // Compute sleep stats
    const avg_sleep_7d = safeDiv(sumBy(h7, "sleepHours"), h7.length);
    const avg_sleep_30d = safeDiv(sumBy(h30, "sleepHours"), h30.length);

    // Minimum sleep in last 7 days
    const min_sleep_7d =
        h7.length === 0 ? 0 : h7.reduce((min, h) => Math.min(min, h.sleepHours ?? min), 999);

    // Count of short sleep nights (<6 hours) in last 7 days
    const short_sleep_nights_7d = h7.filter((h) => (h.sleepHours ?? 0) < 6).length;

    // Compute stress stats
    const avg_health_stress_7d = safeDiv(sumBy(h7, "stressLevel"), h7.length);
    const avg_health_stress_30d = safeDiv(sumBy(h30, "stressLevel"), h30.length);

    // Max stress level in last 7 days
    const max_health_stress_7d = h7.reduce((max, h) => Math.max(max, h.stressLevel ?? 0), 0);
    const high_stress_days_7d = h7.filter((h) => (h.stressLevel ?? 0) >= 7).length;

    // Compute exercise stats
    const avg_exercise_7d = safeDiv(sumBy(h7, "exerciseMinutes"), h7.length);
    const avg_exercise_30d = safeDiv(sumBy(h30, "exerciseMinutes"), h30.length);

    // Days with any exercise in last 7 days
    const days_with_any_exercise_7d = h7.filter((h) => (h.exerciseMinutes ?? 0) > 0).length;

    // Number of health logs
    const num_health_logs_7d = h7.length;
    const num_health_logs_30d = h30.length;

    // High urge and high stress days in last 7 days
    const high_urge_and_high_stress_days_7d = j7.filter((j) => {
        const urge = j.urgeIntensity ?? 0;
        if (urge < 7 || !j.createdAt) return false;
        const dateJ = new Date(j.createdAt as any);

        // Find matching health log for the same day
        const sameDayHealth = h7.find((h) => {
            //@ts-ignore
            const dh = new Date(h.date);
            return (
                dh.getFullYear() === dateJ.getFullYear() &&
                dh.getMonth() === dateJ.getMonth() &&
                dh.getDate() === dateJ.getDate()
            );
        });

        // Check if stress level is high
        return sameDayHealth ? (sameDayHealth.stressLevel ?? 0) >= 7 : false;
    }).length;

    // Build feature set
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

        avg_urge_7d,
        avg_urge_30d,
        max_urge_7d,
        high_urge_events_7d,
        num_journal_entries_7d,
        num_journal_entries_30d,
        days_since_last_entry,

        pct_stress_moods_30d,
        pct_calm_moods_30d,
        pct_happy_moods_30d,

        count_trigger_stress_30d: triggerCounts.Stress,
        count_trigger_boredom_30d: triggerCounts.Boredom,
        count_trigger_anxiety_30d: triggerCounts.Anxiety,
        count_trigger_fatigue_30d: triggerCounts.Fatigue,
        count_trigger_bodyfocus_30d: triggerCounts.BodyFocus,
        count_trigger_screentime_30d: triggerCounts.ScreenTime,
        count_trigger_social_30d: triggerCounts.Social,
        count_trigger_other_30d: triggerCounts.Other,

        avg_sleep_7d,
        avg_sleep_30d,
        min_sleep_7d,
        short_sleep_nights_7d,

        avg_health_stress_7d,
        avg_health_stress_30d,
        max_health_stress_7d,
        high_stress_days_7d,

        avg_exercise_7d,
        avg_exercise_30d,
        days_with_any_exercise_7d,
        num_health_logs_7d,
        num_health_logs_30d,
        days_since_last_health_log,

        high_urge_and_high_stress_days_7d,
    };

    return base;
}

// Create OpenAI chat messages for TrichBot
function computeHeuristicRisk(user: UserProfileLean, journal: JournalLean[]): RelapseSummary {
    // Simple heuristic risk computation
    const severity = typeof user.pulling_severity === "number" ? user.pulling_severity : 0;

    // Determine days stopped
    const daysStopped =
        typeof user.how_long_stopped_days_est === "number"
            ? user.how_long_stopped_days_est
            : typeof user.how_long_stopped_days === "number"
                ? user.how_long_stopped_days
                : 0;

    // Extract urge intensities
    const urges = journal
        .filter((j) => typeof j.urgeIntensity === "number")
        .map((j) => j.urgeIntensity as number);

    // Average urge calculation
    const avgUrge = urges.length ? urges.reduce((sum, v) => sum + v, 0) / urges.length : 0;

    // Normalize and compute risk score
    const severityNorm = Math.min(Math.max(severity / 10, 0), 1);
    const avgUrgeNorm = Math.min(Math.max(avgUrge / 10, 0), 1);

    // Stopped penalty buffer
    const stoppedBuffer = Math.min(daysStopped / 60, 1);
    const stoppedPenalty = stoppedBuffer * 0.3;

    // Final risk score
    let riskScore = severityNorm * 0.5 + avgUrgeNorm * 0.5 - stoppedPenalty;
    riskScore = Math.min(Math.max(riskScore, 0), 1);

    // Determine risk bucket
    let bucket: "low" | "medium" | "high" = "low";
    if (riskScore >= 0.66) bucket = "high";
    else if (riskScore >= 0.33) bucket = "medium";

    // Confidence based on data amount
    const confidence = 0.5 + 0.5 * Math.min(urges.length / 10, 1);

    // Return relapse summary
    return {
        risk_bucket: bucket,
        risk_score: riskScore,
        confidence: Math.min(Math.max(confidence, 0), 1),
        model_version: "heuristic-v2",
    };
}

// Main function to get relapse overview for a user
export async function getRelapseOverviewForUser(
    userId: Types.ObjectId | string
): Promise<RelapseOverviewResult> {
    // Fetch necessary data in parallel
    const [journalRaw, healthRaw, userDocRaw] = await Promise.all([
        JournalEntry.find({ userId }).sort({ createdAt: -1 }).limit(50).lean().exec(),
        HealthLog.find({ userId }).sort({ date: -1 }).limit(30).lean().exec(),
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

    // Data counts
    const journalCount = journal.length;
    const healthCount = health.length;

    // Get sober streak
    const streak = await getSoberStreakForUser(userId);

    // Build features
    const features = userDoc ? buildExtendedFeatures(userDoc, journal, health) : null;
    const hasProfileFeatures = !!features;

    // Check if enough data is available
    const enoughData =
        hasProfileFeatures && journalCount >= MIN_JOURNAL_FOR_RISK && healthCount >= MIN_HEALTH_FOR_RISK;

    // Initialize relapse summary and risk history
    let relapseSummary: RelapseSummary | null = null;
    let riskHistory: RiskHistoryPoint[] = [];

    // If enough data, compute risk using ML or heuristic
    if (enoughData && features && userDoc) {
        let mlResp: MlRelapseResponse | null = null;

        // Try ML prediction
        try {
            mlResp = await predictRelapseOverviewRisk(features);
        } catch (err: any) {
            // Log ML failure and fall back to heuristic
            void loggerService.logWarning(
                "ML relapse-overview failed; falling back to heuristic",
                { error: err?.message ?? String(err) },
                "ml",
                typeof userId === "string" ? userId : undefined
            );
        }

        // Determine relapse summary
        relapseSummary = mlResp
            ? {
                risk_bucket: mlResp.risk_bucket,
                risk_score: mlResp.risk_score,
                confidence: mlResp.confidence,
                model_version: mlResp.model_version ?? "ml-api",
            }
            : computeHeuristicRisk(userDoc, journal);

        // Store overview prediction snapshot
        try {
            await Predict.create({
                userId,
                kind: "overview",
                // Required “friendly” fields in schema — use user profile values
                age: userDoc.age ?? 0,
                age_of_onset: userDoc.age_of_onset ?? 0,
                years_since_onset: userDoc.years_since_onset ?? Math.max((userDoc.age ?? 0) - (userDoc.age_of_onset ?? 0), 0),

                pulling_severity: userDoc.pulling_severity ?? 0,
                pulling_frequency: userDoc.pulling_frequency ?? "unknown",
                pulling_awareness: userDoc.pulling_awareness ?? "unknown",
                successfully_stopped: userDoc.successfully_stopped ?? "unknown",
                how_long_stopped_days:
                    userDoc.how_long_stopped_days_est ??
                    userDoc.how_long_stopped_days ??
                    0,
                emotion: (userDoc.emotion ?? "neutral") as string,

                overviewFeatures: features as any,

                risk_score: relapseSummary.risk_score,
                risk_bucket: relapseSummary.risk_bucket,
                confidence: relapseSummary.confidence,
                model_version: relapseSummary.model_version ?? "overview",
                served_by: mlResp ? "FastAPI" : "heuristic",
            });
        } catch (e: any) {
            // Log storage failure but continue
            void loggerService.logWarning(
                "Failed to store Predict overview snapshot",
                { error: e?.message ?? String(e) },
                "system",
                typeof userId === "string" ? userId : undefined
            );
        }

        // History from journal urgeIntensity (0–10 → 0–1)
        riskHistory = journal
            .filter(
                (j): j is Required<Pick<JournalLean, "urgeIntensity" | "createdAt">> =>
                    typeof j.urgeIntensity === "number" && !!j.createdAt
            )
            .slice()
            .reverse()
            .map((j) => ({
                date: new Date(j.createdAt as any).toISOString(),
                score: (j.urgeIntensity as number) / 10,
            }))
            .slice(0, 20);
    }

    // Log the overview computation
    void loggerService.logInfo(
        "Relapse overview computed",
        { journalCount, healthCount, enoughData },
        "system",
        typeof userId === "string" ? userId : undefined
    );

    // Return the overview result
    return {
        ok: true,
        enoughData,
        relapseSummary,
        riskHistory,
        streak: { current: streak.current ?? 0, previous: streak.previous ?? 0 },
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
