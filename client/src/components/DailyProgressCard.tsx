// client/src/components/DailyProgressCard.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes, css, useTheme } from "styled-components";
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

/**---------------
    Helpers
------------------*/
function clamp01(n: number) {
    return Math.max(0, Math.min(1, n));
}

/**
 * Converts theme colors (hex/rgb/rgba) -> rgba with a given alpha.
 * Safe fallback: returns original color if parsing fails.
 */
function withAlpha(color: string, alpha: number): string {
    const a = clamp01(alpha);
    const c = String(color || "").trim();

    // rgba(r,g,b,a)
    const rgba = c.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i);
    if (rgba) {
        const r = Number(rgba[1]);
        const g = Number(rgba[2]);
        const b = Number(rgba[3]);
        if ([r, g, b].every((x) => Number.isFinite(x))) return `rgba(${r}, ${g}, ${b}, ${a})`;
        return c;
    }

    // rgb(r,g,b)
    const rgb = c.match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i);
    if (rgb) {
        const r = Number(rgb[1]);
        const g = Number(rgb[2]);
        const b = Number(rgb[3]);
        if ([r, g, b].every((x) => Number.isFinite(x))) return `rgba(${r}, ${g}, ${b}, ${a})`;
        return c;
    }

    // #RGB / #RRGGBB
    if (c.startsWith("#")) {
        const hex = c.slice(1);
        const isShort = hex.length === 3;
        const isLong = hex.length === 6;
        if (!isShort && !isLong) return c;

        const full = isShort
            ? hex
                  .split("")
                  .map((ch) => ch + ch)
                  .join("")
            : hex;

        const r = parseInt(full.slice(0, 2), 16);
        const g = parseInt(full.slice(2, 4), 16);
        const b = parseInt(full.slice(4, 6), 16);

        if ([r, g, b].some((x) => Number.isNaN(x))) return c;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    return c;
}

/**---------------
    Animations
------------------*/
const softPulse = keyframes`
    0%   { transform: translateY(0); opacity: 0.8; }
    50%  { transform: translateY(-2px); opacity: 1; }
    100% { transform: translateY(0); opacity: 0.9; }
`;

const shimmer = keyframes`
    0%   { transform: translateX(-30%) rotate(8deg); opacity: 0; }
    25%  { opacity: 0.18; }
    70%  { opacity: 0.14; }
    100% { transform: translateX(130%) rotate(8deg); opacity: 0; }
`;

/**--------------
    Styled UI
-----------------*/
const CardShell = styled.section`
    position: relative;
    width: 100%;
    overflow: hidden;

    padding: 1.35rem 1rem;
    border-radius: ${({ theme }) => theme.radius.lg};
    text-align: center;

    animation: ${fadeIn} 0.55s ease-out;
    transform-style: preserve-3d;
    transition: transform 0.15s ease-out, box-shadow 0.2s ease-out;

    ${({ theme }) => css`
        background: ${theme.colors.card_bg};
        border: 1px solid ${theme.colors.primary}; /* ✅ requested */
        backdrop-filter: blur(5px);

        /* ✅ match RiskResultCard shadow exactly */
        box-shadow: 0 16px 40px #0d6275;

        &::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.22) 0%,
                rgba(255, 255, 255, 0) 50%
            );
            pointer-events: none;
        }
    `}

    /* subtle animated highlight band */
    &::before {
        content: "";
        position: absolute;
        inset: -30% -40%;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.42) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        filter: blur(10px);
        opacity: 0;
        animation: ${shimmer} 5.5s ease-in-out infinite;
        pointer-events: none;
    }

    &:hover {
        transform: translateY(-2px) scale(1.01);
    }

    @media (min-width: 768px) {
        padding: 1.6rem 1.35rem;
    }
`;

const RingWrap = styled.div`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    animation: ${scaleIn} 0.55s ease-out;

    .progress-ring__value {
        transition: stroke-dasharray 0.9s ease-out;
    }
`;

const ProgressLabelContainer = styled.div`
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    text-align: center;
    pointer-events: none;
`;

const ProgressLabel = styled.div`
    font-size: 1.7rem;
    font-weight: 950;
    letter-spacing: -0.02em;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const ProgressSub = styled.div`
    margin-top: -2px;
    font-size: 0.9rem;
    font-weight: 800;
    opacity: 0.85;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const Trend = styled.div<{ $color: string; $highlight: boolean }>`
    position: absolute;
    bottom: -1.9rem;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: ${({ $color }) => $color};
    font-weight: 950;

    padding: 0.3rem 0.55rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);

    ${({ $highlight }) =>
        $highlight &&
        css`
            animation: ${softPulse} 1.4s ease-out 0.25s;
        `}
`;

const Caption = styled.div`
    margin-top: 0.95rem;
    font-size: 1.02rem;
    font-weight: 950;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const SubMsg = styled.div`
    margin-top: 0.25rem;
    font-size: 0.92rem;
    font-weight: 650;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const MetaRow = styled.div`
    margin-top: 0.95rem;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
`;

const MetaPill = styled.div`
    padding: 0.4rem 0.7rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 900;

    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);

    color: ${({ theme }) => theme.colors.text_secondary};

    strong {
        color: ${({ theme }) => theme.colors.text_primary};
        font-weight: 950;
    }
`;

const MiniHistory = styled.div`
    margin-top: 0.95rem;
    width: 100%;
    max-width: 560px;

    display: grid;
    grid-template-columns: repeat(14, 1fr);
    gap: 7px;
    align-items: center;
    justify-items: center;
`;

const Dot = styled.div<{ $bg: string }>`
    width: 12px;
    height: 12px;
    border-radius: 999px;

    background: ${({ $bg }) => $bg};
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.10);
    border: 1px solid rgba(0, 0, 0, 0.08);
`;

const DotLegend = styled.div`
    margin-top: 0.65rem;
    font-size: 0.82rem;
    font-weight: 650;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const Actions = styled.div`
    margin-top: 1.05rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
    max-width: 460px;
    margin-left: auto;
    margin-right: auto;
`;

const ActionBtn = styled.button<{ $tone: "good" | "bad" }>`
    border: none;
    cursor: pointer;
    border-radius: 16px;
    padding: 0.78rem 0.85rem;
    font-weight: 950;
    letter-spacing: 0.01em;

    background: ${({ $tone }) =>
        $tone === "good"
            ? "rgba(120, 255, 190, 0.22)"
            : "rgba(255, 173, 120, 0.22)"};

    border: 1px solid ${({ $tone }) =>
        $tone === "good"
            ? "rgba(120, 255, 190, 0.5)"
            : "rgba(255, 173, 120, 0.5)"};

    color: ${({ theme }) => theme.colors.text_primary};

    transition: transform 0.15s ease-out, filter 0.15s ease-out;

    &:hover {
        transform: translateY(-1px);
        filter: brightness(1.02);
    }

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }

    &:focus-visible {
        outline: 2px solid rgba(0, 0, 0, 0.22);
        outline-offset: 2px;
    }
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
    const theme = useTheme();

    const pct = Math.max(0, Math.min(1, score / max));
    const isImprovement = score > prevScore;
    const isReset = prevScore > 0 && score === 0;

    // ✅ Theme-driven ring colors
    const trackColor = withAlpha(theme.colors.primary, 0.18);
    const progressColor = theme.colors.primary;

    // ✅ Theme-driven trend colors
    const trendColor = isImprovement
        ? theme.colors.low_risk
        : isReset
            ? theme.colors.high_risk
            : theme.colors.text_secondary;

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
        <CardShell aria-label={ariaLabel}>
            <RingWrap>
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
                    <div>
                        <ProgressLabel>{animScore.toFixed(0)}</ProgressLabel>
                        <ProgressSub>{centerSubLabel}</ProgressSub>
                    </div>
                </ProgressLabelContainer>

                <Trend $color={trendColor} $highlight={isImprovement} aria-label="Trend indicator">
                    {isImprovement ? <ArrowUp /> : isReset ? <ArrowDown /> : <Minus />}
                    {Math.abs(score - prevScore)}
                </Trend>
            </RingWrap>

            <Caption>{caption}</Caption>
            <SubMsg>
                {isReset
                    ? "Relapse day logged — your progress is still saved below."
                    : isImprovement
                        ? "Nice — keep going."
                        : "Stay steady."}
            </SubMsg>
        </CardShell>
    );
};

export const DailyProgressCardAuto: React.FC = () => {
    const theme = useTheme();
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

    // ✅ Theme-driven dots
    const soberDot = withAlpha(theme.colors.primary, 0.85);
    const relapseDot = withAlpha(theme.colors.high_risk, 0.85);

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
                                $bg={d.relapsed ? relapseDot : soberDot}
                                title={`${d.day} • ${d.relapsed ? "Relapse" : "Sober"}`}
                            />
                        ))}
                    </MiniHistory>
                    <DotLegend>Last 14 days: primary = sober, high risk = relapse.</DotLegend>
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
