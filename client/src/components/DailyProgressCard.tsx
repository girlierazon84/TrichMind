// client/src/components/DailyProgressCard.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { fadeIn, scaleIn } from "@/styles";
import { useSoberStreak } from "@/hooks";

/**-----------------------------------
    SVG Icons for trend indicators
--------------------------------------*/
const ArrowUp = () => (
    <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
    >
        <path d="M12 19V6" />
        <path d="M5 12l7-7 7 7" />
    </svg>
);

const ArrowDown = () => (
    <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
    >
        <path d="M12 5v13" />
        <path d="M19 12l-7 7-7-7" />
    </svg>
);

const Minus = () => (
    <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
    >
        <path d="M5 12h14" />
    </svg>
);

/**-------------------------------------
    Local check-in storage (client)
----------------------------------------*/
type DailyCheckIn = {
    date: string; // YYYY-MM-DD
    relapsed: boolean;
};

const LS_KEY = "tm_daily_checkins_v1";

function dateKeyLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function addDaysLocal(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function safeLoadCheckIns(): DailyCheckIn[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((x) => {
                const obj = x as Partial<DailyCheckIn>;
                if (typeof obj?.date !== "string") return null;
                if (typeof obj?.relapsed !== "boolean") return null;
                if (!/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) return null;
                return { date: obj.date, relapsed: obj.relapsed };
            })
            .filter((x): x is DailyCheckIn => x !== null)
            .sort((a, b) => a.date.localeCompare(b.date));
    } catch {
        return [];
    }
}

function safeSaveCheckIns(items: DailyCheckIn[]) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {
        // ignore
    }
}

function upsertCheckIn(items: DailyCheckIn[], next: DailyCheckIn): DailyCheckIn[] {
    const map = new Map(items.map((x) => [x.date, x]));
    map.set(next.date, next);
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function computeCurrentStreak(checkIns: DailyCheckIn[], today: string): number {
    // Walk backwards from today; streak counts consecutive non-relapse days.
    const byDate = new Map(checkIns.map((c) => [c.date, c.relapsed]));
    let streak = 0;

    // If today is not checked in, we still compute based on last known days,
    // but streak won’t include today unless checked in as non-relapse.
    let cursor = today;

    for (let i = 0; i < 3650; i += 1) {
        const relapsed = byDate.get(cursor);
        if (relapsed === undefined) {
            // No entry for this date => stop streak
            break;
        }
        if (relapsed) break;

        streak += 1;

        const d = new Date(`${cursor}T12:00:00`);
        cursor = dateKeyLocal(addDaysLocal(d, -1));
    }

    return streak;
}

function computeBestStreak(checkIns: DailyCheckIn[]): number {
    let best = 0;
    let run = 0;

    for (let i = 0; i < checkIns.length; i += 1) {
        if (checkIns[i].relapsed) {
            best = Math.max(best, run);
            run = 0;
        } else {
            run += 1;
            best = Math.max(best, run);
        }
    }

    return best;
}

function computeLastStreakBeforeRelapse(checkIns: DailyCheckIn[]): number {
    // Find latest relapse and count consecutive non-relapse days immediately before it.
    const idx = [...checkIns].reverse().findIndex((x) => x.relapsed);
    if (idx === -1) return 0;

    const relapseIndexFromStart = checkIns.length - 1 - idx;
    let run = 0;

    for (let i = relapseIndexFromStart - 1; i >= 0; i -= 1) {
        if (checkIns[i].relapsed) break;
        run += 1;
    }
    return run;
}

function countRelapseDays(checkIns: DailyCheckIn[]): number {
    return checkIns.reduce((acc, x) => acc + (x.relapsed ? 1 : 0), 0);
}

/**-------------------------------------
    Styled Components and Animations
----------------------------------------*/
const softPulse = keyframes`
    from { opacity: 0.85; transform: translateY(0); }
    50%  { opacity: 1; transform: translateY(-1px); }
    to   { opacity: 0.9; transform: translateY(0); }
`;

const Wrapper = styled.section<{ $risk: "low" | "medium" | "high" }>`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    width: 100%;
    max-width: 980px;
    margin: 0;

    padding: 16px 14px 14px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    animation: ${fadeIn} 0.45s ease-out;

    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: ${({ theme }) => theme.colors.card_shadow};

    ${({ $risk, theme }) =>
        $risk === "high" &&
        css`
            border-color: rgba(255, 0, 64, 0.18);
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.12);
        `}

    @media (min-width: 768px) {
        padding: 18px 16px 16px;
    }
`;

const Card = styled.div`
    position: relative;
    display: inline-flex;
    animation: ${scaleIn} 0.6s ease-out;
    transition: transform 0.25s ease;

    &:hover {
        transform: translateY(-1px);
    }

    svg {
        overflow: visible;
    }

    .progress-ring__value {
        transition: stroke-dasharray 0.9s ease-out;
    }
`;

const ProgressLabelContainer = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    width: 100%;
    pointer-events: none;
`;

const ProgressLabel = styled.div`
    font-size: 1.55rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const ProgressSub = styled.div`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const Trend = styled.div<{ $color: string; $highlight: boolean }>`
    position: absolute;
    bottom: -1.7rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: ${({ $color }) => $color};
    font-weight: 900;
    font-size: 0.92rem;

    ${({ $highlight }) =>
        $highlight &&
        css`
            animation: ${softPulse} 1.5s ease-out 0.2s;
        `}
`;

const Caption = styled.div`
    margin-top: 0.75rem;
    font-size: 1.02rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const SubMsg = styled.div`
    margin-top: 0.35rem;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    line-height: 1.35;
`;

const MetaRow = styled.div`
    margin-top: 12px;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
`;

const MetaPill = styled.div<{ $tone?: "ok" | "warn" }>`
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 900;
    border: 1px solid rgba(0, 0, 0, 0.08);

    background: ${({ $tone }) =>
        $tone === "warn" ? "rgba(255, 173, 120, 0.18)" : "rgba(120, 255, 190, 0.18)"};

    color: ${({ theme, $tone }) =>
        $tone === "warn" ? theme.colors.medium_risk : theme.colors.low_risk};
`;

const CheckInRow = styled.div`
    margin-top: 12px;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;

    @media (min-width: 520px) {
        max-width: 420px;
    }
`;

const CheckButton = styled.button<{ $tone?: "ok" | "warn" }>`
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: ${({ $tone }) =>
        $tone === "warn" ? "rgba(255, 173, 120, 0.18)" : "rgba(120, 255, 190, 0.18)"};
    color: ${({ theme }) => theme.colors.text_primary};
    border-radius: 16px;
    padding: 10px 12px;
    font-weight: 950;
    cursor: pointer;

    &:hover {
        filter: brightness(0.98);
    }

    &:focus-visible {
        outline: 2px solid rgba(0, 0, 0, 0.22);
        outline-offset: 2px;
    }
`;

const Timeline = styled.div`
    margin-top: 12px;
    width: 100%;
    max-width: 520px;
`;

const TimelineLabel = styled.div`
    font-size: 0.8rem;
    font-weight: 850;
    color: ${({ theme }) => theme.colors.text_secondary};
    margin-bottom: 6px;
`;

const DotRow = styled.div`
    display: grid;
    grid-template-columns: repeat(14, 1fr);
    gap: 6px;
`;

const Dot = styled.div<{ $state: "none" | "ok" | "relapse" | "today" }>`
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.10);

    background: ${({ $state }) =>
        $state === "relapse"
            ? "rgba(255, 0, 64, 0.22)"
            : $state === "ok"
                ? "rgba(38, 196, 133, 0.20)"
                : $state === "today"
                    ? "rgba(91, 138, 255, 0.20)"
                    : "rgba(0,0,0,0.04)"};
`;

/**------------------------------------------
    Props for DailyProgressCard component
---------------------------------------------*/
type Props = {
    score: number;
    prevScore?: number;
    max?: number;
    size?: number;
    stroke?: number;
    caption?: string;
    centerSubLabel?: string;
    // New (optional) meta to show progress without “forgetting” after relapse
    bestStreak?: number;
    lastStreakBeforeRelapse?: number;
    relapseDays?: number;
    checkIns?: DailyCheckIn[];
};

/**--------------------------------
    DailyProgressCard Component
-----------------------------------*/
export const DailyProgressCard: React.FC<Props> = ({
    score,
    prevScore = 0,
    max = 30,
    size = 170,
    stroke = 16,
    caption = "Daily progress",
    centerSubLabel = "Days strong",
    bestStreak = 0,
    lastStreakBeforeRelapse = 0,
    relapseDays = 0,
    checkIns = [],
}) => {
    const pct = Math.max(0, Math.min(1, score / max));
    const risk: "low" | "medium" | "high" = pct >= 0.66 ? "low" : pct >= 0.33 ? "medium" : "high";

    const isImprovement = score > prevScore;
    const isReset = prevScore > 0 && score === 0;

    const trackColor = "rgba(0,0,0,0.08)";
    const progressColor = "#21b2ba";
    const trendColor = isImprovement ? "#26c485" : isReset ? "#ff0040" : "#95a5a6";

    const [animScore, setAnimScore] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const start = performance.now();
        const dur = 900;
        let frame: number;

        const animate = (t: number) => {
            const progress = Math.min(1, (t - start) / dur);
            setAnimScore(score * (1 - Math.pow(1 - progress, 3)));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [score]);

    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = circ * pct;

    const ariaLabel = `${caption}: ${Math.round(animScore)} ${centerSubLabel}.`;

    return (
        <Wrapper $risk={risk} aria-label={ariaLabel}>
            <Card>
                <svg width={size} height={size} role="img" aria-label={ariaLabel}>
                    <title>{ariaLabel}</title>
                    <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
                    <circle
                        className="progress-ring__value"
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke={progressColor}
                        strokeWidth={stroke}
                        fill="none"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                </svg>

                <ProgressLabelContainer>
                    <ProgressLabel>{animScore.toFixed(0)}</ProgressLabel>
                    <ProgressSub>{centerSubLabel}</ProgressSub>
                </ProgressLabelContainer>

                <Trend $color={trendColor} $highlight={isImprovement} aria-label="Trend indicator">
                    {isImprovement ? <ArrowUp /> : isReset ? <ArrowDown /> : <Minus />}
                    {Math.abs(score - prevScore)}
                </Trend>
            </Card>

            <Caption>{caption}</Caption>
            <SubMsg>
                {isReset
                    ? "Relapse days are part of your story — your progress is still here."
                    : isImprovement
                        ? "Nice work — keep building momentum."
                        : "Steady progress matters. One day at a time."}
            </SubMsg>

            <MetaRow>
                <MetaPill $tone="ok">Best streak: {bestStreak}</MetaPill>
                <MetaPill $tone="ok">Before relapse: {lastStreakBeforeRelapse}</MetaPill>
                <MetaPill $tone="warn">Relapse days: {relapseDays}</MetaPill>
            </MetaRow>

            {/* timeline is optional, but recommended */}
            {checkIns.length > 0 && (
                <Timeline aria-label="Last 14 days check-in timeline">
                    <TimelineLabel>Last 14 days</TimelineLabel>
                    <DotRow>
                        {(() => {
                            const today = dateKeyLocal(new Date());
                            const byDate = new Map(checkIns.map((c) => [c.date, c.relapsed]));

                            const days = Array.from({ length: 14 }, (_, i) => {
                                const d = addDaysLocal(new Date(), -(13 - i));
                                const k = dateKeyLocal(d);
                                return k;
                            });

                            return days.map((k) => {
                                const relapsed = byDate.get(k);
                                const state: "none" | "ok" | "relapse" | "today" =
                                    k === today
                                        ? "today"
                                        : relapsed === true
                                            ? "relapse"
                                            : relapsed === false
                                                ? "ok"
                                                : "none";

                                return <Dot key={k} $state={state} title={k} aria-label={k} />;
                            });
                        })()}
                    </DotRow>
                </Timeline>
            )}
        </Wrapper>
    );
};

/**------------------------------------
    DailyProgressCardAuto Component
---------------------------------------*/
export const DailyProgressCardAuto: React.FC = () => {
    const { data, loading, error } = useSoberStreak();

    const [hydrated, setHydrated] = useState(false);
    const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setHydrated(true);
        setCheckIns(safeLoadCheckIns());
    }, []);

    const today = useMemo(() => (hydrated ? dateKeyLocal(new Date()) : ""), [hydrated]);

    const todayEntry = useMemo(() => {
        if (!hydrated || !today) return null;
        return checkIns.find((x) => x.date === today) ?? null;
    }, [checkIns, hydrated, today]);

    const metrics = useMemo(() => {
        // If user has local history, use it as source of truth (keeps relapse memory)
        if (hydrated && checkIns.length > 0 && today) {
            const current = computeCurrentStreak(checkIns, today);
            const best = computeBestStreak(checkIns);
            const beforeRelapse = computeLastStreakBeforeRelapse(checkIns);
            const relapses = countRelapseDays(checkIns);

            // “prevScore” = yesterday’s streak (approx)
            const yesterday = dateKeyLocal(addDaysLocal(new Date(), -1));
            const prev = computeCurrentStreak(checkIns, yesterday);

            return {
                current,
                prev,
                best,
                beforeRelapse,
                relapses,
                source: "local" as const,
            };
        }

        // fallback to backend streak (if local not started yet)
        const current = data?.currentStreak ?? 0;
        const prev = data?.previousStreak ?? 0;

        return {
            current,
            prev,
            best: Math.max(current, prev),
            beforeRelapse: 0,
            relapses: 0,
            source: "server" as const,
        };
    }, [checkIns, data?.currentStreak, data?.previousStreak, hydrated, today]);

    const handleCheckIn = async (relapsed: boolean) => {
        if (!hydrated) return;
        if (!today) return;

        setSaving(true);
        try {
            const next = upsertCheckIn(checkIns, { date: today, relapsed });
            setCheckIns(next);
            safeSaveCheckIns(next);
        } finally {
            setSaving(false);
        }
    };

    // Server states only matter when local not started
    if (!hydrated) return <p aria-live="polite">Loading progress…</p>;
    if (metrics.source === "server") {
        if (loading) return <p aria-live="polite">Loading streak…</p>;
        if (error) return <p role="alert">{error}</p>;
        if (!data) return <p>No progress data yet.</p>;
    }

    return (
        <>
            <DailyProgressCard
                score={metrics.current}
                prevScore={metrics.prev}
                max={30}
                caption="Daily progress"
                centerSubLabel="Days strong"
                bestStreak={metrics.best}
                lastStreakBeforeRelapse={metrics.beforeRelapse}
                relapseDays={metrics.relapses}
                checkIns={checkIns}
            />

            {/* Daily check-in CTA */}
            <div style={{ width: "100%", maxWidth: 980, margin: "10px auto 0" }}>
                {todayEntry ? (
                    <p style={{ margin: "10px 0 0", textAlign: "center" }} aria-live="polite">
                        Checked in today: <strong>{todayEntry.relapsed ? "Relapse" : "No relapse"}</strong>
                        {" • "}
                        You can change it any time today.
                    </p>
                ) : (
                    <>
                        <p style={{ margin: "10px 0 8px", textAlign: "center" }}>
                            Check in for today to keep your progress accurate.
                        </p>
                        <CheckInRow>
                            <CheckButton
                                type="button"
                                $tone="ok"
                                onClick={() => handleCheckIn(false)}
                                disabled={saving}
                                aria-label="Check in: no relapse today"
                            >
                                No relapse today
                            </CheckButton>
                            <CheckButton
                                type="button"
                                $tone="warn"
                                onClick={() => handleCheckIn(true)}
                                disabled={saving}
                                aria-label="Check in: relapse today"
                            >
                                Relapse today
                            </CheckButton>
                        </CheckInRow>
                    </>
                )}
            </div>
        </>
    );
};

export default DailyProgressCard;
