// client/src/components/DailyProgressCard.tsx

import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { fadeIn, scaleIn } from "@/styles";
import { useSoberStreak } from "@/hooks";

// Icons
const ArrowUp = () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V6" /><path d="M5 12l7-7 7 7" />
    </svg>
);

const ArrowDown = () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v13" /><path d="M19 12l-7 7-7-7" />
    </svg>
);

const Minus = () => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
    </svg>
);

// Animation
const softPulse = keyframes`
    from { opacity: 0.8; transform: translateY(0); }
    50%  { opacity: 1; transform: translateY(-2px); }
    to   { opacity: 0.9; transform: translateY(0); }
`;

// Styled components
const Wrapper = styled.div<{ $risk: "low" | "medium" | "high" }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.8rem 1rem;
    border-radius: ${({ theme }) => theme.radius.lg};
    animation: ${fadeIn} 0.45s ease-out;
    margin-bottom: 2rem;

    ${({ theme, $risk }) =>
        $risk === "low"
            ? css`box-shadow: ${theme.colors.low_risk_gradient};`
            : $risk === "medium"
                ? css`box-shadow: ${theme.colors.medium_risk_gradient};`
                : css`box-shadow: ${theme.colors.high_risk_gradient};`
    }
`;

const Card = styled.div`
    position: relative;
    display: inline-flex;
    animation: ${scaleIn} 0.6s ease-out;
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
    font-weight: 600;
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
    `}
`;

const Caption = styled.div`
    margin-top: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
`;

const SubMsg = styled.div`
    margin-top: 0.25rem;
    font-size: 0.9rem;
    opacity: 0.8;
`;

// type definitions
type Props = {
    score: number;
    prevScore?: number;
    max?: number;
    size?: number;
    stroke?: number;
    caption?: string;
    centerSubLabel?: string;
};

// Main component
export const DailyProgressCard: React.FC<Props> = ({
    score,
    prevScore = 0,
    max = 30,
    size = 170,
    stroke = 16,
    caption = "Sober Streak",
    centerSubLabel = "Days Strong",
}) => {
    const pct = Math.max(0, Math.min(1, score / max));
    const risk: "low" | "medium" | "high" =
        pct >= 0.66 ? "low" : pct >= 0.33 ? "medium" : "high";

    const isImprovement = score > prevScore;
    const isReset = prevScore > 0 && score === 0;

    const color =
        risk === "low" ? "#21b2ba" : risk === "medium" ? "#f1c40f" : "#e74c3c";

    const [animScore, setAnimScore] = useState(0);

    useEffect(() => {
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

    return (
        <Wrapper $risk={risk}>
            <Card>
                <svg width={size} height={size}>
                    <circle cx={size / 2} cy={size / 2} r={r} stroke="#e4eff0" strokeWidth={stroke} fill="none" />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke={color}
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

                <Trend
                    $color={isImprovement ? "#2ecc71" : isReset ? "#e74c3c" : "#95a5a6"}
                    $highlight={isImprovement}
                >
                    {isImprovement ? <ArrowUp /> : isReset ? <ArrowDown /> : <Minus />}
                    {Math.abs(score - prevScore)}
                </Trend>
            </Card>

            <Caption>{caption}</Caption>
            <SubMsg>
                {isReset
                    ? "Start fresh — every day counts!"
                    : isImprovement
                        ? "Keep going strong!"
                        : "Stay consistent."}
            </SubMsg>
        </Wrapper>
    );
};

export const DailyProgressCardAuto = () => {
    const { data, loading } = useSoberStreak();
    if (loading) return <p>Loading streak…</p>;
    if (!data) return <p>No streak data yet.</p>;

    return (
        <DailyProgressCard score={data.currentStreak} prevScore={data.previousStreak} />
    );
};

export default DailyProgressCard;
