// client/src/components/RiskResultCard.tsx

import React, { useEffect, useState, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import type { PredictionResponse } from "@/types/ml";

/**------------------------------------------------
    🧠 Risk Result Data Type (extends ML type)
---------------------------------------------------*/
export interface RiskResultData extends PredictionResponse {
    model_version?: string;
}

/**------------------
    🌀 Animations
---------------------*/
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(12px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const floatUp = keyframes`
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
`;

const shimmer = keyframes`
    0% { opacity:.5; }
    50% { opacity:1; }
    100% { opacity:.5; }
`;

const pulseAura = keyframes`
    0%   { opacity:0.25; transform: scale(.92); }
    50%  { opacity:0.65; transform: scale(1.03); }
    100% { opacity:0.25; transform: scale(.92); }
`;

const shineSweep = keyframes`
    0% { left:-120%; }
    100% { left:120%; }
`;

/**--------------------------
    🎨 Styled Components
-----------------------------*/
type RiskLevel = "low" | "medium" | "high";

const TiltWrapper = styled.div`
    perspective: 900px;
    width: 100%;
`;

const Card = styled.div<{ $risk: RiskLevel; $compact?: boolean }>`
    position: relative;
    padding: ${({ $compact }) => ($compact ? "1.2rem" : "2rem")};
    border-radius: ${({ theme }) => theme.radius.lg};
    text-align: center;

    animation: ${fadeIn} 0.6s ease-out, ${floatUp} 6s ease-in-out infinite;
    transform-style: preserve-3d;
    transition: transform 0.15s ease-out;

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
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(5px);

            &::before {
                content: "";
                position: absolute;
                inset: -26px;
                border-radius: inherit;
                z-index: -1;
                background: ${border};
                filter: blur(45px);
                opacity: 0.45;
                animation: ${pulseAura} 4s infinite ease-in-out;
            }

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
        `;
    }}
`;

const Shine = styled.div`
    position: absolute;
    top: 0;
    left: -120%;
    width: 60%;
    height: 100%;

    background: linear-gradient(
        120deg,
        rgba(255, 255, 255, 0.45) 0%,
        rgba(255, 255, 255, 0.1) 60%,
        rgba(255, 255, 255, 0) 100%
    );

    filter: blur(6px);
    animation: ${shineSweep} 4s ease-in-out infinite;
    pointer-events: none;
`;

const Title = styled.h3<{ $compact?: boolean }>`
    font-size: ${({ $compact }) => ($compact ? "1rem" : "1.4rem")};
    font-weight: 700;
    margin-bottom: 0.4rem;
    color: white;
`;

const RiskLabel = styled.div<{ $compact?: boolean }>`
    font-size: ${({ $compact }) => ($compact ? "1.4rem" : "2.1rem")};
    font-weight: 900;
    margin-bottom: 0.4rem;
    color: white;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    animation: ${shimmer} 2.3s ease-in-out infinite;
`;

const ScoreLine = styled.div<{ $compact?: boolean }>`
    font-size: ${({ $compact }) => ($compact ? ".85rem" : "1rem")};
    margin-bottom: 0.6rem;
    color: white;

    b {
        font-size: ${({ $compact }) => ($compact ? "1rem" : "1.2rem")};
    }
`;

const ConfidenceWrapper = styled.div`
    width: 100%;
    max-width: 260px;
    margin: 0.5rem auto;
`;

const ConfidenceHeader = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: white;
    opacity: 0.9;
`;

const ConfidenceTrack = styled.div`
    height: 8px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 9999px;
`;

const ConfidenceBar = styled.div<{ w: number; $risk: RiskLevel }>`
    height: 8px;
    border-radius: 9999px;
    width: ${({ w }) => w}%;
    transition: width 0.7s ease-out;

    ${({ theme, $risk }) =>
        $risk === "low"
            ? `background: ${theme.colors.low_risk};`
            : $risk === "medium"
            ? `background: ${theme.colors.medium_risk};`
            : `background: ${theme.colors.high_risk};`}
`;

const Quote = styled.p<{ $compact?: boolean }>`
    margin-top: 1rem;
    opacity: 0.9;
    font-style: italic;
    color: white;
    font-size: ${({ $compact }) => ($compact ? ".8rem" : "0.95rem")};
`;

const ModelInfo = styled.div`
    margin-top: 1rem;
    font-size: 0.72rem;
    opacity: 0.8;
    color: white;
`;

/**------------------
    🧠 Component
---------------------*/
export const RiskResultCard: React.FC<{
    data: RiskResultData;
    compact?: boolean;
    quote?: string;
}> = ({ data, compact = false, quote }) => {
    const { risk_bucket, risk_score, confidence, model_version } = data;
    const band = risk_bucket.toLowerCase() as RiskLevel;

    const [score, setScore] = useState(0);
    const [conf, setConf] = useState(0);

    const cardRef = useRef<HTMLDivElement>(null);

    const handleMove = (e: React.MouseEvent) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        const rotateX = (y / rect.height) * -12;
        const rotateY = (x / rect.width) * 12;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
    };

    const resetTilt = () => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
    };

    useEffect(() => {
        const duration = 900;
        const start = performance.now();

        const targetScore = risk_score * 100;
        const targetConf = confidence * 100;

        const frame = requestAnimationFrame(function animate(time) {
            const t = Math.min(1, (time - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);

            setScore(targetScore * eased);
            setConf(targetConf * eased);

            if (t < 1) requestAnimationFrame(animate);
        });

        return () => cancelAnimationFrame(frame);
    }, [risk_score, confidence]);

    const fallback = {
        low: "Your calm foundation is strong — keep nurturing it 🌿",
        medium: "Small mindful choices today shape your tomorrow ✨",
        high: "Pause. Breathe. You are in control, even now ❤️",
    } as const;

    return (
        <TiltWrapper>
            <Card
                ref={cardRef}
                $risk={band}
                $compact={compact}
                onMouseMove={handleMove}
                onMouseLeave={resetTilt}
            >
                <Shine />

                <Title $compact={compact}>Relapse Risk Summary</Title>

                <RiskLabel $compact={compact}>
                    {band.toUpperCase()}
                </RiskLabel>

                <ScoreLine $compact={compact}>
                    Score: <b>{score.toFixed(1)}%</b>
                </ScoreLine>

                <ConfidenceWrapper>
                    <ConfidenceHeader>
                        <span>Confidence</span>
                        <span>{conf.toFixed(1)}%</span>
                    </ConfidenceHeader>

                    <ConfidenceTrack>
                        <ConfidenceBar w={conf} $risk={band} />
                    </ConfidenceTrack>
                </ConfidenceWrapper>

                <Quote $compact={compact}>“{quote || fallback[band]}”</Quote>
                <ModelInfo>Model: {model_version || "v1.0.0"}</ModelInfo>
            </Card>
        </TiltWrapper>
    );
};

export default RiskResultCard;
