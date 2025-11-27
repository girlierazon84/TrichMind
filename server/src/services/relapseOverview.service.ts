// server/src/services/relapseOverview.service.ts

import type { Types } from "mongoose";
import { JournalEntry, HealthLog, User } from "../models";
import { logger } from "../utils";
import {
    predictRelapseRisk,
    type RelapseFeatures,
    type MlRelapseResponse,
} from "../services";

// Tunable thresholds for "enough data"
const MIN_JOURNAL_FOR_RISK = 5;
const MIN_HEALTH_FOR_RISK = 3;

// Lean types from Mongo
interface JournalLean {
    urgeIntensity?: number;
    createdAt?: Date | string;
}

interface HealthLean {
    sleepHours?: number;
    stressLevel?: number;
    exerciseMinutes?: number;
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

/**
 * Temporary streak helper.
 * TODO: replace with your real streak service when ready.
 */
async function getSoberStreakForUser(
    _userId: Types.ObjectId | string
): Promise<StreakInfo> {
    // For now we just return 0/0 – keeps API shape correct
    return { current: 0, previous: 0 };
}

/**
 * Build the feature vector your ML model expects,
 * directly from the user's profile fields.
 */
function buildProfileFeatures(user: UserProfileLean): RelapseFeatures | null {
    const {
        age,
        age_of_onset,
        years_since_onset,
        pulling_severity,
        pulling_frequency,
        pulling_awareness,
        successfully_stopped,
        how_long_stopped_days,
        emotion,
    } = user;

    // Basic validation: if key fields are missing, we can't call the ML model
    if (
        typeof age !== "number" ||
        typeof age_of_onset !== "number" ||
        typeof pulling_severity !== "number" ||
        typeof pulling_frequency !== "string" ||
        typeof pulling_awareness !== "string" ||
        typeof how_long_stopped_days !== "number" ||
        typeof emotion !== "string" ||
        typeof successfully_stopped === "undefined"
    ) {
        return null;
    }

    return {
        age,
        age_of_onset,
        years_since_onset: years_since_onset ?? age - age_of_onset,

        pulling_severity,
        pulling_frequency,
        pulling_awareness,
        successfully_stopped,
        how_long_stopped_days,

        emotion,
    };
}

/**
 * Simple heuristic relapse-risk scoring (fallback when ML is unavailable).
 * Uses profile fields + a bit of journal context.
 */
function computeHeuristicRisk(
    user: UserProfileLean,
    journal: JournalLean[]
): RelapseSummary {
    const severity =
        typeof user.pulling_severity === "number"
            ? user.pulling_severity
            : 5;

    const daysStopped =
        typeof user.how_long_stopped_days === "number"
            ? user.how_long_stopped_days
            : 0;

    const urges: number[] = journal
        .filter((j) => typeof j.urgeIntensity === "number")
        .map((j) => j.urgeIntensity as number);

    const avgUrge =
        urges.length > 0
            ? urges.reduce((sum, v) => sum + v, 0) / urges.length
            : 0;

    const severityNorm = Math.min(Math.max(severity / 10, 0), 1);
    const avgUrgeNorm = Math.min(Math.max(avgUrge / 10, 0), 1);

    // If they've been stopped longer, gently reduce risk
    const stoppedBuffer = Math.min(daysStopped / 60, 1); // cap after ~2 months
    const stoppedPenalty = stoppedBuffer * 0.3;

    let riskScore = severityNorm * 0.5 + avgUrgeNorm * 0.5 - stoppedPenalty;
    riskScore = Math.min(Math.max(riskScore, 0), 1);

    let bucket: "low" | "medium" | "high" = "low";
    if (riskScore >= 0.66) bucket = "high";
    else if (riskScore >= 0.33) bucket = "medium";

    const confidence = 0.5 + 0.5 * Math.min(urges.length / 10, 1);

    return {
        risk_bucket: bucket,
        risk_score: riskScore,
        confidence: Math.min(Math.max(confidence, 0), 1),
        model_version: "heuristic-v2",
    };
}

export async function getRelapseOverviewForUser(
    userId: Types.ObjectId | string
): Promise<RelapseOverviewResult> {
    // 1) Load recent data
    const [journalRaw, healthRaw, userDocRaw] = await Promise.all([
        JournalEntry.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()
            .exec(),
        HealthLog.find({ user: userId })
            .sort({ date: -1 })
            .limit(30)
            .lean()
            .exec(),
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
                    "emotion",
                    "coping_worked",
                    "coping_not_worked",
                ].join(" ")
            )
            .lean()
            .exec(),
    ]);

    const journal = (journalRaw ?? []) as JournalLean[];
    const health = (healthRaw ?? []) as HealthLean[];
    const userDoc = (userDocRaw ?? null) as UserProfileLean | null;

    const journalCount = journal.length;
    const healthCount = health.length;

    // 2) Sober streak (placeholder)
    const streak = await getSoberStreakForUser(userId);

    // Do we have profile features for ML?
    const features = userDoc ? buildProfileFeatures(userDoc) : null;
    const hasProfileFeatures = !!features;

    // Require both profile + a minimum of journal/health data
    const enoughData =
        hasProfileFeatures &&
        journalCount >= MIN_JOURNAL_FOR_RISK &&
        healthCount >= MIN_HEALTH_FOR_RISK;

    let relapseSummary: RelapseSummary | null = null;
    let riskHistory: RiskHistoryPoint[] = [];

    if (enoughData && features) {
        // Try ML service first; fall back to heuristic on error
        let mlResp: MlRelapseResponse | null = null;

        try {
            mlResp = await predictRelapseRisk(features);
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            logger.warn(
                `⚠️ ML relapse-risk service failed, using heuristic: ${msg}`
            );
        }

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
