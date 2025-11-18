// client/src/components/DailyProgressCard.tsx

import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { fadeIn, scaleIn } from "@/styles";
import { useSoberStreak } from "@/hooks";


// Icons
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
    >
        <path d="M5 12h14" />
    </svg>
);

// Animations
const softPulse = keyframes`
    from { opacity: 0.8; transform: translateY(0); }
    50%  { opacity: 1; transform: translateY(-2px); }
    to   { opacity: 0.9; transform: translateY(0); }
`;

const glowPulse = keyframes`
    0%   { opacity: 0.55; }
    50%  { opacity: 0.9;  }
    100% { opacity: 0.55; }
`;

const borderFlow = keyframes`
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const Wrapper = styled.div<{ $risk: "low" | "medium" | "high" }>`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    padding: 1.8rem 1rem;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    margin-bottom: 2rem;
    animation: ${fadeIn} 0.45s ease-out;
    overflow: visible;

    ${({ theme, $risk }) => {
        const gradient =
            $risk === "low"
                ? theme.colors.low_risk_gradient
                : $risk === "medium"
                ? theme.colors.medium_risk_gradient
                : theme.colors.high_risk_gradient;

        return css`
            /* 🟦 STRONG Animated Gradient Border */
            border: 3px solid transparent;
            background-image:
                linear-gradient(${gradient}),
                linear-gradient(${theme.colors.card_bg}, ${theme.colors.card_bg});
            background-origin: border-box;
            background-clip: border-box, padding-box;
            animation: ${borderFlow} 5s ease infinite;

            /* ⭐ SUBTLE glow hugging the border only */
            &::before {
                content: "";
                position: absolute;
                inset: -4px;
                border-radius: inherit;
                background: ${gradient};
                filter: blur(10px);
                opacity: 0.45;
                animation: ${glowPulse} 3.6s ease-in-out infinite;
                z-index: -1;
            }

            /* 🌑 LIGHT shadow (not heavy, not large) */
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
        `;
    }}
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

    // Stroke color for the circular progress (not the glow)
    const color =
        risk === "low" ? "#22c55e" : risk === "medium" ? "#f76e19" : "#ff0004";

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
                    $color={
                        isImprovement
                            ? "#2ecc71"
                            : isReset
                            ? "#e74c3c"
                            : "#95a5a6"
                    }
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

// Auto component fetching data
export const DailyProgressCardAuto = () => {
    const { data, loading } = useSoberStreak();
    if (loading) return <p>Loading streak…</p>;
    if (!data) return <p>No streak data yet.</p>;

    return (
        <DailyProgressCard
            score={data.currentStreak}
            prevScore={data.previousStreak}
        />
    );
};

export default DailyProgressCard;
