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

const borderFlow = keyframes`
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

// Styled Components
const Wrapper = styled.div<{ $risk: "low" | "medium" | "high" }>`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    perspective: 900px;
    width: 100%;
    max-width: 960px;
    margin: 2rem 0 0 0;;

    padding: 1.8rem 1rem;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
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
        border: 3px solid transparent;
        background-image:
            linear-gradient(${gradient}),
            linear-gradient(${theme.colors.card_bg}, ${theme.colors.card_bg});
        background-origin: border-box;
        background-clip: border-box, padding-box;
        animation: ${borderFlow} 5s ease infinite;

        /* Cohesive 3D shadow */
        box-shadow: 0 16px 40px #0d6275;
    `;
    }}
`;

const Card = styled.div`
    position: relative;
    display: inline-flex;
    animation: ${scaleIn} 0.6s ease-out;
    transition: transform 0.25s ease, box-shadow 0.25s ease;

    &:hover {
        transform: translateY(-2px) scale(1.01);
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

/**----------------------------------
    Daily Progress Card Component
-------------------------------------*/
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

    // Progress circle colors (fixed)
    const trackColor = "#e0f7f9";
    const progressColor = "#21b2ba";

    // Trend colors — down arrow bright red when relapsed
    const trendColor = isImprovement
        ? "#2ecc71"
        : isReset
            ? "#ff0004"
            : "#95a5a6";

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
                    {/* Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke={trackColor}
                        strokeWidth={stroke}
                        fill="none"
                    />
                    {/* Progress */}
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

                <Trend $color={trendColor} $highlight={isImprovement}>
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

/**---------------------------------
    Auto component fetching data
------------------------------------*/
export const DailyProgressCardAuto: React.FC = () => {
    const { data, loading, error } = useSoberStreak();

    if (loading) return <p>Loading streak…</p>;
    if (error) return <p>{error}</p>;
    if (!data) return <p>No streak data yet.</p>;

    return (
        <DailyProgressCard
            score={data.currentStreak}
            prevScore={data.previousStreak}
        />
    );
};

export default {
    DailyProgressCard,
    DailyProgressCardAuto,
};
