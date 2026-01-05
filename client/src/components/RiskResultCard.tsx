// client/src/components/RiskResultCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import type { PredictionResponse, RiskBucket } from "@/types/ml";


/**----------------------
    Styled Components
-------------------------*/
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(12px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const shimmer = keyframes`
    0% { opacity:.5; }
    50% { opacity:1; }
    100% { opacity:.5; }
`;

const shineSweep = keyframes`
    0% { left:-120%; }
    100% { left:120%; }
`;

const TiltWrapper = styled.div`
    perspective: 900px;
    width: 100%;
    max-width: 960px;
    margin: 2rem 0 0 0;
`;

const Card = styled.div<{ $risk: RiskBucket; $compact?: boolean }>`
    position: relative;
    padding: ${({ $compact }) => ($compact ? "1.2rem" : "2rem")};
    border-radius: ${({ theme }) => theme.radius.lg};
    text-align: center;
    width: 100%;
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
            backdrop-filter: blur(5px);
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

const ConfidenceBar = styled.div<{ $w: number; $risk: RiskBucket }>`
    height: 8px;
    border-radius: 9999px;
    width: ${({ $w }) => $w}%;
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

const ModelVersionTag = styled.span`
    display: block;
    margin-top: 0.2rem;
    font-size: 0.7rem;
    opacity: 0.8;
    color: #fdfdfd;
`;

/**---------------------
    Helper Functions
------------------------*/
function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

// Accepts either 0–1 or 0–100 and returns 0–100
function toPct(value: unknown): number {
    let n: number | null = null;

    if (typeof value === "number") n = value;
    else if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) n = parsed;
    }

    if (n === null) return 0;

    const v = n <= 1.5 ? n * 100 : n;
    return clamp(v, 0, 100);
}

function normalizeRiskBucket(v: unknown): RiskBucket {
    const s = String(v ?? "medium").toLowerCase();
    return s === "low" || s === "medium" || s === "high" ? (s as RiskBucket) : "medium";
}

/**-------------------
    Main Component
----------------------*/
export const RiskResultCard: React.FC<{
    data: PredictionResponse;
    compact?: boolean;
    quote?: string;
}> = ({ data, compact = false, quote }) => {
    const band = useMemo(() => normalizeRiskBucket(data.risk_bucket), [data.risk_bucket]);

    const targetScore = useMemo(() => toPct(data.risk_score), [data.risk_score]);
    const targetConf = useMemo(() => toPct(data.confidence), [data.confidence]);

    const [score, setScore] = useState(0);
    const [conf, setConf] = useState(0);

    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const duration = 900;
        const start = performance.now();

        let frameId = requestAnimationFrame(function animate(time) {
            const t = Math.min(1, (time - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);

            setScore(targetScore * eased);
            setConf(targetConf * eased);

            if (t < 1) frameId = requestAnimationFrame(animate);
        });

        return () => cancelAnimationFrame(frameId);
    }, [targetScore, targetConf]);

    const fallback: Record<RiskBucket, string> = {
        low: "Your calm foundation is strong — keep nurturing it 🌿",
        medium: "Small mindful choices today shape your tomorrow ✨",
        high: "Pause. Breathe. You are in control, even now ❤️",
    };

    return (
        <TiltWrapper>
            <Card
                ref={cardRef}
                $risk={band}
                $compact={compact}
                onMouseMove={(e) => {
                    const card = cardRef.current;
                    if (!card) return;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    const rotateX = (y / rect.height) * -12;
                    const rotateY = (x / rect.width) * 12;
                    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
                }}
                onMouseLeave={() => {
                    const card = cardRef.current;
                    if (!card) return;
                    card.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
                }}
                aria-label={`Relapse risk summary: ${band}, score ${score.toFixed(
                    1
                )} percent, confidence ${conf.toFixed(1)} percent.`}
            >
                <Shine />

                <Title $compact={compact}>
                    Relapse Risk Summary
                    {data.model_version && <ModelVersionTag>Model: {data.model_version}</ModelVersionTag>}
                </Title>

                <RiskLabel $compact={compact}>{band.toUpperCase()}</RiskLabel>

                <ScoreLine $compact={compact}>
                    Score: <b>{score.toFixed(1)}%</b>
                </ScoreLine>

                <ConfidenceWrapper>
                    <ConfidenceHeader>
                        <span>Confidence</span>
                        <span>{conf.toFixed(1)}%</span>
                    </ConfidenceHeader>

                    <ConfidenceTrack>
                        <ConfidenceBar $w={conf} $risk={band} />
                    </ConfidenceTrack>
                </ConfidenceWrapper>

                <Quote $compact={compact}>“{quote || fallback[band]}”</Quote>
            </Card>
        </TiltWrapper>
    );
};

export default RiskResultCard;
