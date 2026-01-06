// client/src/components/DailyProgressCard.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { fadeIn, scaleIn } from "@/styles";
import { useSoberStreak } from "@/hooks";


/**----------
    Icons
-------------*/
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
    >
        <path d="M5 12h14" />
    </svg>
);

const softPulse = keyframes`
    from { opacity: 0.8; transform: translateY(0); }
    50%  { opacity: 1; transform: translateY(-2px); }
    to   { opacity: 0.9; transform: translateY(0); }
`;

const Wrapper = styled.section<{ $risk: "low" | "medium" | "high" }>`
    position: relative;
    width: 100%;
    text-align: center;

    padding: 1.35rem 1.1rem;
    border-radius: ${({ theme }) => theme.radius.lg};

    animation: ${fadeIn} 0.6s ease-out;
    transform-style: preserve-3d;
    transition: transform 0.15s ease-out, box-shadow 0.2s ease-out;

    ${({ theme, $risk }) => {
        const bg =
            $risk === "low"
                ? theme.colors.low_risk_gradient
                : $risk === "medium"
                    ? theme.colors.medium_risk_gradient
                    : theme.colors.high_risk_gradient;

        const border =
            $risk === "low"
                ? theme.colors.low_risk
                : $risk === "medium"
                    ? theme.colors.medium_risk
                    : theme.colors.high_risk;

        return css`
            background: ${bg};
            border: 1px solid ${border};
            backdrop-filter: blur(6px);
            box-shadow: 0 16px 40px #0d6275;

            &::after {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: inherit;
                background: linear-gradient(
                    145deg,
                    rgba(255, 255, 255, 0.22) 0%,
                    rgba(255, 255, 255, 0) 55%
                );
                pointer-events: none;
            }
        `;
    }}

    &:hover {
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 22px 54px rgba(13, 98, 117, 0.55);
    }
`;

const Inner = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Card = styled.div`
    position: relative;
    display: inline-flex;
    animation: ${scaleIn} 0.6s ease-out;

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
    font-weight: 950;
    letter-spacing: -0.01em;
    color: rgba(255, 255, 255, 0.92);
    text-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
`;

const ProgressSub = styled.div`
    font-size: 0.9rem;
    opacity: 0.85;
    color: rgba(255, 255, 255, 0.88);
`;

const Trend = styled.div<{ $highlight: boolean }>`
    position: absolute;
    bottom: -2rem;
    display: flex;
    gap: 0.35rem;
    align-items: center;
    justify-content: center;

    color: rgba(255, 255, 255, 0.92);

    ${({ $highlight }) =>
        $highlight &&
        css`
            animation: ${softPulse} 1.5s ease-out 0.4s;
        `}
`;

const TrendPill = styled.span<{ $tone: "up" | "down" | "flat" }>`
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 950;
    letter-spacing: 0.01em;

    background: ${({ $tone }) =>
        $tone === "up"
            ? "rgba(120, 255, 190, 0.24)"
            : $tone === "down"
                ? "rgba(255, 173, 120, 0.26)"
                : "rgba(255, 255, 255, 0.16)"};

    border: 1px solid
        ${({ $tone }) =>
            $tone === "up"
                ? "rgba(120, 255, 190, 0.45)"
                : $tone === "down"
                    ? "rgba(255, 173, 120, 0.45)"
                    : "rgba(255, 255, 255, 0.22)"};
`;

const Caption = styled.div`
    margin-top: 0.75rem;
    font-size: 1.02rem;
    font-weight: 950;
    color: rgba(255, 255, 255, 0.92);
`;

const SubMsg = styled.div`
    margin-top: 0.3rem;
    font-size: 0.92rem;
    opacity: 0.9;
    color: rgba(255, 255, 255, 0.88);
`;

const MetaRow = styled.div`
    margin-top: 0.95rem;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
`;

const MetaPill = styled.div`
    padding: 0.35rem 0.65rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 950;
    color: rgba(255, 255, 255, 0.92);

    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(6px);
`;

const Actions = styled.div`
    margin-top: 1rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
    max-width: 420px;
`;

const ActionBtn = styled.button<{ $tone: "good" | "bad" }>`
    border: none;
    cursor: pointer;
    border-radius: 16px;
    padding: 0.8rem 0.85rem;
    font-weight: 950;

    color: rgba(255, 255, 255, 0.96);
    background: ${({ $tone }) =>
        $tone === "good"
            ? "rgba(120, 255, 190, 0.22)"
            : "rgba(255, 173, 120, 0.22)"};
    border: 1px solid
        ${({ $tone }) =>
            $tone === "good"
                ? "rgba(120, 255, 190, 0.42)"
                : "rgba(255, 173, 120, 0.42)"};

    transition: transform 0.14s ease, background 0.18s ease, box-shadow 0.18s ease;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.14);
        background: ${({ $tone }) =>
            $tone === "good"
                ? "rgba(120, 255, 190, 0.28)"
                : "rgba(255, 173, 120, 0.28)"};
    }

    &:active {
        transform: translateY(0);
        box-shadow: none;
    }

    &:disabled {
        opacity: 0.65;
        cursor: not-allowed;
        transform: none;
    }

    &:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.6);
        outline-offset: 2px;
    }
`;

const MiniHistory = styled.div`
    margin-top: 0.95rem;
    width: 100%;
    max-width: 520px;
    display: grid;
    grid-template-columns: repeat(14, 1fr);
    gap: 6px;
    align-items: center;
    justify-items: center;
`;

const Dot = styled.div<{ $relapsed: boolean; $active?: boolean }>`
    width: 12px;
    height: 12px;
    border-radius: 999px;

    background: ${({ $relapsed }) =>
        $relapsed ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.18)"};

    opacity: ${({ $active }) => ($active ? 1 : 0.75)};
    border: 1px solid rgba(255, 255, 255, 0.28);
`;

const DotLegend = styled.div`
    margin-top: 0.6rem;
    font-size: 0.84rem;
    opacity: 0.88;
    color: rgba(255, 255, 255, 0.9);
`;

type Props = {
    score: number;
    prevScore?: number;
    max?: number;
    size?: number;
    stroke?: number;
    caption?: string;
    centerSubLabel?: string;
};

export const DailyProgressCard: React.FC<Props> = ({
    score,
    prevScore = 0,
    max = 30,
    size = 170,
    stroke = 16,
    caption = "Current streak",
    centerSubLabel = "Days",
}) => {
    const pct = Math.max(0, Math.min(1, score / max));
    const risk: "low" | "medium" | "high" = pct >= 0.66 ? "low" : pct >= 0.33 ? "medium" : "high";

    const isImprovement = score > prevScore;
    const isReset = prevScore > 0 && score === 0;

    // keep ring readable over gradients (white ring)
    const trackColor = "rgba(255,255,255,0.24)";
    const progressColor = "rgba(255,255,255,0.92)";

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

    const trendTone: "up" | "down" | "flat" = isImprovement ? "up" : isReset ? "down" : "flat";
    const trendLabel = isImprovement ? "Improving" : isReset ? "Reset" : "Steady";

    return (
        <Wrapper $risk={risk} aria-label={ariaLabel}>
            <Inner>
                <Card>
                    <svg width={size} height={size} role="img" aria-label={ariaLabel}>
                        <title>{ariaLabel}</title>
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={r}
                            stroke={trackColor}
                            strokeWidth={stroke}
                            fill="none"
                        />
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

                    <Trend $highlight={isImprovement} aria-label="Trend indicator">
                        {isImprovement ? <ArrowUp /> : isReset ? <ArrowDown /> : <Minus />}
                        <TrendPill $tone={trendTone}>
                            {trendLabel} • {Math.abs(score - prevScore)}
                        </TrendPill>
                    </Trend>
                </Card>

                <Caption>{caption}</Caption>
                <SubMsg>
                    {isReset
                        ? "Relapse day logged — your progress is still saved below."
                        : isImprovement
                            ? "Nice — keep going."
                            : "Stay steady."}
                </SubMsg>
            </Inner>
        </Wrapper>
    );
};

export const DailyProgressCardAuto: React.FC = () => {
    const { data, loading, error, checkIn } = useSoberStreak();
    const [saving, setSaving] = useState<null | "sober" | "relapse">(null);

    const last14 = data?.last14 ?? [];
    const relapseCount = data?.relapseCount ?? 0;
    const longest = data?.longestStreak ?? 0;
    const previous = data?.previousStreak ?? 0;

    const ringMax = useMemo(() => {
        const cur = data?.currentStreak ?? 0;
        return Math.max(30, longest, cur);
    }, [data?.currentStreak, longest]);

    if (loading) return <p aria-live="polite">Loading progress…</p>;
    if (error) return <p role="alert">{error}</p>;
    if (!data) return <p>No progress data yet.</p>;

    const handleCheckIn = async (relapsed: boolean) => {
        setSaving(relapsed ? "relapse" : "sober");
        try {
            await checkIn(relapsed);
        } finally {
            setSaving(null);
        }
    };

    return (
        <div>
            <DailyProgressCard
                score={data.currentStreak}
                prevScore={data.previousStreak ?? 0}
                max={ringMax}
                caption="Current streak"
                centerSubLabel="Days"
            />

            <MetaRow>
                <MetaPill>
                    Previous streak: <strong>{previous}</strong>
                </MetaPill>
                <MetaPill>
                    Best streak: <strong>{longest}</strong>
                </MetaPill>
                <MetaPill>
                    Relapses logged: <strong>{relapseCount}</strong>
                </MetaPill>
            </MetaRow>

            {last14.length > 0 && (
                <>
                    <MiniHistory aria-label="Last 14 check-ins">
                        {last14.map((d) => (
                            <Dot
                                key={d.day}
                                $relapsed={!!d.relapsed}
                                title={`${d.day} • ${d.relapsed ? "Relapse" : "Sober"}`}
                                $active
                            />
                        ))}
                    </MiniHistory>
                    <DotLegend>Last 14 days: bright dot = relapse, dark dot = sober.</DotLegend>
                </>
            )}

            <Actions aria-label="Daily check-in actions">
                <ActionBtn
                    type="button"
                    $tone="good"
                    onClick={() => void handleCheckIn(false)}
                    disabled={saving !== null}
                >
                    {saving === "sober" ? "Saving…" : "No pulling today"}
                </ActionBtn>

                <ActionBtn
                    type="button"
                    $tone="bad"
                    onClick={() => void handleCheckIn(true)}
                    disabled={saving !== null}
                >
                    {saving === "relapse" ? "Saving…" : "I pulled today"}
                </ActionBtn>
            </Actions>
        </div>
    );
};

export default DailyProgressCard;
