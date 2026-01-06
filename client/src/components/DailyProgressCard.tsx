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
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V6" />
        <path d="M5 12l7-7 7 7" />
    </svg>
);
const ArrowDown = () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 5v13" />
        <path d="M19 12l-7 7-7-7" />
    </svg>
);
const Minus = () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
    </svg>
);

const softPulse = keyframes`
    from { opacity: 0.8; transform: translateY(0); }
    50%  { opacity: 1; transform: translateY(-2px); }
    to   { opacity: 0.9; transform: translateY(0); }
`;

const borderFlow = keyframes`
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const Wrapper = styled.section<{ $risk: "low" | "medium" | "high" }>`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    perspective: 900px;
    width: 100%;

    padding: 1.5rem 1rem;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    animation: ${fadeIn} 0.45s ease-out;

    ${({ theme, $risk }) => {
        const gradient =
            $risk === "low"
                ? theme.colors.low_risk_gradient
                : $risk === "medium"
                    ? theme.colors.medium_risk_gradient
                    : theme.colors.high_risk_gradient;

        return css`
            border: 3px solid transparent;
            background-image: linear-gradient(${gradient}),
                linear-gradient(${theme.colors.card_bg}, ${theme.colors.card_bg});
            background-origin: border-box;
            background-clip: border-box, padding-box;
            animation: ${borderFlow} 5s ease infinite;
            box-shadow: 0 14px 34px rgba(13, 98, 117, 0.35);
        `;
    }}
`;

const Card = styled.div`
    position: relative;
    display: inline-flex;
    animation: ${scaleIn} 0.6s ease-out;
    transition: transform 0.25s ease;

    &:hover {
        transform: translateY(-2px) scale(1.01);
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
    font-size: 1.5rem;
    font-weight: 700;
`;

const ProgressSub = styled.div`
    font-size: 0.9rem;
    opacity: 0.8;
`;

const Trend = styled.div<{ $color: string; $highlight: boolean }>`
    position: absolute;
    bottom: -2rem;
    display: flex;
    gap: 0.3rem;
    color: ${({ $color }) => $color};

    ${({ $highlight }) =>
        $highlight &&
        css`
            animation: ${softPulse} 1.5s ease-out 0.4s;
        `
    }
`;

const Caption = styled.div`
    margin-top: 0.7rem;
    font-size: 1rem;
    font-weight: 700;
`;

const SubMsg = styled.div`
    margin-top: 0.25rem;
    font-size: 0.9rem;
    opacity: 0.85;
`;

const MetaRow = styled.div`
    margin-top: 0.85rem;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
`;

const MetaPill = styled.div`
    padding: 0.35rem 0.65rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 800;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
`;

const Actions = styled.div`
    margin-top: 0.95rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
    max-width: 420px;
`;

const ActionBtn = styled.button<{ $tone: "good" | "bad" }>`
    border: none;
    cursor: pointer;
    border-radius: 14px;
    padding: 0.75rem 0.8rem;
    font-weight: 900;

    background: ${({ $tone }) => ($tone === "good" ? "rgba(120, 255, 190, 0.18)" : "rgba(255, 173, 120, 0.18)")};
    border: 1px solid ${({ $tone }) => ($tone === "good" ? "rgba(120, 255, 190, 0.55)" : "rgba(255, 173, 120, 0.55)")};

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    &:focus-visible {
        outline: 2px solid rgba(0, 0, 0, 0.22);
        outline-offset: 2px;
    }
`;

const MiniHistory = styled.div`
    margin-top: 0.9rem;
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
    background: ${({ $relapsed }) => ($relapsed ? "rgba(255, 0, 40, 0.75)" : "rgba(33, 178, 186, 0.75)")};
    opacity: ${({ $active }) => ($active ? 1 : 0.65)};
    border: 1px solid rgba(0, 0, 0, 0.08);
`;

const DotLegend = styled.div`
    margin-top: 0.55rem;
    font-size: 0.82rem;
    opacity: 0.85;
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

    const trackColor = "#e0f7f9";
    const progressColor = "#21b2ba";
    const trendColor = isImprovement ? "#2ecc71" : isReset ? "#ff0004" : "#95a5a6";

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
            <SubMsg>{isReset ? "Relapse day logged — your progress is still saved below." : isImprovement ? "Nice — keep going." : "Stay steady."}</SubMsg>
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

    // Ring max should scale gently but not jumpy
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
                <MetaPill>Previous streak: <strong>{previous}</strong></MetaPill>
                <MetaPill>Best streak: <strong>{longest}</strong></MetaPill>
                <MetaPill>Relapses logged: <strong>{relapseCount}</strong></MetaPill>
            </MetaRow>

            {last14.length > 0 && (
                <>
                    <MiniHistory aria-label="Last 14 check-ins">
                        {last14.map((d) => (
                            <Dot key={d.day} $relapsed={!!d.relapsed} title={`${d.day} • ${d.relapsed ? "Relapse" : "Sober"}`} $active />
                        ))}
                    </MiniHistory>
                    <DotLegend>Last 14 days: teal = sober, red = relapse.</DotLegend>
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
