// client/src/components/DailyProgressCard.tsx

import React, { useMemo, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { fadeIn, scaleIn } from "@/styles";
import { useSoberStreak } from "@/hooks";

// ──────────────────────────────
// SVG Icons
// ──────────────────────────────
const ArrowUp = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V6" />
        <path d="M5 12l7-7 7 7" />
    </svg>
);

const ArrowDown = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v13" />
        <path d="M19 12l-7 7-7-7" />
    </svg>
);

const Minus = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
    </svg>
);

// ──────────────────────────────
// Types
// ──────────────────────────────
export interface DailyProgressCardProps {
    score: number;
    prevScore?: number;
    max?: number;
    size?: number;
    stroke?: number;
    caption?: string;
    centerSubLabel?: string;
    color?: string;
    className?: string;
}

// ──────────────────────────────
// Animations
// ──────────────────────────────
const softPulse = keyframes`
    from { transform: translateY(0); opacity: 0.8; }
    50%  { transform: translateY(-2px); opacity: 1; }
    to   { transform: translateY(0); opacity: 0.9; }
`;

// ──────────────────────────────
// Styled Components
// ──────────────────────────────
const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 2rem;
    animation: ${fadeIn} 0.45s ease-out;
`;

const Card = styled.div`
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    animation: ${scaleIn} 0.6s ease-out;

    circle {
        transition: stroke-dasharray 0.8s ease-out, stroke 0.4s ease-out;
    }
`;

const ProgressLabelContainer = styled.div`
    position: absolute;
    text-align: center;
`;

const ProgressLabel = styled.div`
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const ProgressSubLabel = styled.div`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const ProgressTrend = styled.div<{ $color: string; $highlight: boolean }>`
    position: absolute;
    bottom: -2rem;
    color: ${({ $color }) => $color};
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    ${({ $highlight }) =>
        $highlight &&
        `
        animation: ${softPulse} 1.6s ease-out 0.4s;
    `}
`;

const Caption = styled.div`
    font-size: 1rem;
    font-weight: 600;
    margin-top: 0.75rem;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const SubText = styled.p`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    margin-top: 0.25rem;
    animation: ${fadeIn} 0.6s ease-out;
`;

// ──────────────────────────────
// Main Component
// ──────────────────────────────
export const DailyProgressCard: React.FC<DailyProgressCardProps> = ({
    score,
    prevScore,
    max = 30,
    size = 172,
    stroke = 16,
    caption = "Sober Streak",
    centerSubLabel = "Days Strong",
    color,
    className,
}) => {
    const pct = Math.max(0, Math.min(1, score / max));
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const dash = circumference * pct;

    const progressColor =
        color || (score === 0 ? "#e74c3c" : pct < 0.33 ? "#f1c40f" : "#21b2ba");

    const delta = prevScore !== undefined ? score - prevScore : 0;
    const deltaAbs = Math.abs(delta).toFixed(0);
    const isImprovement = delta > 0;
    const isReset = score === 0 && prevScore !== undefined && prevScore > 0;
    const TrendIcon = isImprovement ? ArrowUp : isReset ? ArrowDown : Minus;
    const trendColor = isImprovement ? "#2ecc71" : isReset ? "#e74c3c" : "#95a5a6";
    const highlightTrend = isImprovement && !isReset;

    const streakMessage = isReset
        ? "Start fresh — every day counts!"
        : score >= max
            ? "🎉 Goal achieved!"
            : isImprovement
                ? "Keep going strong!"
                : "Stay consistent.";

    // Calm count-up for center number
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        const target = score;
        const duration = 900;
        const start = performance.now();
        let frame: number;

        const animate = (time: number) => {
            const t = Math.min(1, (time - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplayScore(target * eased);
            if (t < 1) {
                frame = requestAnimationFrame(animate);
            }
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [score]);

    return (
        <Wrapper className={className}>
            <Card>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke="#e4eff0"
                        strokeWidth={stroke}
                        fill="none"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke={progressColor}
                        strokeWidth={stroke}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                </svg>

                <ProgressLabelContainer>
                    <ProgressLabel>{displayScore.toFixed(0)}</ProgressLabel>
                    <ProgressSubLabel>{centerSubLabel}</ProgressSubLabel>
                </ProgressLabelContainer>

                {prevScore !== undefined && (
                    <ProgressTrend $color={trendColor} $highlight={highlightTrend}>
                        <TrendIcon size={18} /> {isImprovement ? "+" : isReset ? "−" : "±"}
                        {deltaAbs}
                    </ProgressTrend>
                )}
            </Card>

            <Caption>{caption}</Caption>
            <SubText>{streakMessage}</SubText>
        </Wrapper>
    );
};

// ──────────────────────────────
// 🧠 AUTO VERSION — Backend Fetched
// ──────────────────────────────
export const DailyProgressCardAuto: React.FC = () => {
    const { data, loading } = useSoberStreak();

    const content = useMemo(() => {
        if (loading) return <p>Loading streak data...</p>;
        if (!data) return <p>No streak data available yet — start logging!</p>;

        return (
            <DailyProgressCard
                score={data.currentStreak || 0}
                prevScore={data.previousStreak || 0}
                max={30}
                caption="Sober Streak"
                centerSubLabel="Days Strong"
            />
        );
    }, [data, loading]);

    return <>{content}</>;
};

export default DailyProgressCard;
