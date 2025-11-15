// client/src/components/RiskResultCard.tsx

import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";


/* ──────────────────────────────
    🧩 Interfaces
────────────────────────────── */
export interface PredictResponse {
    risk_score: number;        // 0..1
    risk_bucket: string;       // "low" | "medium" | "high"
    risk_code?: number;
    confidence: number;        // 0..1
    model_version?: string;
}

export interface RiskResultCardProps {
    data: PredictResponse;
    quote?: string;
    className?: string;
    compact?: boolean;
}

/* ──────────────────────────────
    ⚙️ Helpers
────────────────────────────── */
type RiskLevel = "low" | "medium" | "high";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ──────────────────────────────
    🎞 Calm Animations
────────────────────────────── */
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const pulseHigh = keyframes`
    0%, 100% { box-shadow: 0 0 15px rgba(231, 76, 60, 0.18); }
    50%      { box-shadow: 0 0 28px rgba(231, 76, 60, 0.32); }
`;

const softGlow = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

/* ──────────────────────────────
    🎨 Styled Components
────────────────────────────── */
const Card = styled.div<{ risk: RiskLevel; compact?: boolean }>`
    background: ${({ theme, risk }) =>
        risk === "low"
            ? theme.colors.low_risk_gradient
            : risk === "medium"
                ? theme.colors.medium_risk_gradient
                : theme.colors.high_risk_gradient};

    color: ${({ risk }) =>
        risk === "low" ? "#064e3b" : risk === "medium" ? "#78350f" : "#7f1d1d"};

    padding: ${({ theme, compact }) => (compact ? theme.spacing(5) : theme.spacing(8))};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: ${({ theme, compact }) => (compact ? theme.spacing(4) : theme.spacing(6))};
    animation: ${fadeIn} 0.45s ease-out;
    width: 100%;
    max-width: ${({ compact }) => (compact ? "420px" : "540px")};
    align-self: center;

    ${({ risk }) =>
        risk === "high" &&
        css`
            animation: ${fadeIn} 0.45s ease-out, ${pulseHigh} 3s ease-in-out infinite;
        `}
`;

const Title = styled.h3<{ compact?: boolean }>`
    font-size: ${({ compact }) => (compact ? "1.1rem" : "1.4rem")};
    font-weight: 700;
    margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const RiskLabel = styled.div<{ compact?: boolean }>`
    font-size: ${({ compact }) => (compact ? "1.5rem" : "2rem")};
    font-weight: 800;
    text-transform: uppercase;
    margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const ScoreLine = styled.div<{ compact?: boolean }>`
    font-size: ${({ compact }) => (compact ? "0.9rem" : "1rem")};
    margin-bottom: ${({ theme }) => theme.spacing(3)};
    animation: ${softGlow} 0.5s ease-out;
    b {
        font-size: ${({ compact }) => (compact ? "1rem" : "1.15rem")};
    }
`;

const ConfidenceWrapper = styled.div`
    width: 100%;
    max-width: 260px;
    text-align: left;
    margin-top: ${({ theme }) => theme.spacing(1)};
`;

const ConfidenceHeader = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    margin-bottom: 0.3rem;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const ConfidenceBarTrack = styled.div`
    background: rgba(255, 255, 255, 0.4);
    border-radius: 9999px;
    height: 8px;
    overflow: hidden;
`;

const ConfidenceBar = styled.div<{ width: number }>`
    height: 8px;
    width: ${({ width }) => width}%;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 9999px;
    transition: width 0.8s ease-out;
`;

const QuoteText = styled.p<{ compact?: boolean }>`
    font-style: italic;
    font-size: ${({ compact }) => (compact ? "0.8rem" : "0.85rem")};
    color: ${({ theme }) => theme.colors.text_secondary};
    margin-top: ${({ theme }) => theme.spacing(3)};
    animation: ${fadeIn} 0.6s ease-out;
`;

const ModelInfo = styled.div<{ compact?: boolean }>`
    font-size: ${({ compact }) => (compact ? "0.7rem" : "0.75rem")};
    color: ${({ theme }) => theme.colors.text_secondary};
    margin-top: ${({ theme }) => theme.spacing(3)};
    opacity: 0.85;
`;

/* ──────────────────────────────
    🧠 Component
────────────────────────────── */
export const RiskResultCard: React.FC<RiskResultCardProps> = ({
    data,
    quote,
    className,
    compact = false,
}) => {
    const { risk_score, risk_bucket, confidence, model_version } = data;

    const normalized = clamp01(risk_score ?? 0);
    const confNorm = clamp01(confidence ?? 0);
    const band = (risk_bucket?.toLowerCase() as RiskLevel) || "medium";

    // Calm count-up animation for score & confidence
    const [displayScore, setDisplayScore] = useState(0);
    const [displayConfidence, setDisplayConfidence] = useState(0);

    useEffect(() => {
        const targetScore = normalized * 100;
        const targetConf = confNorm * 100;
        const duration = 800;
        const start = performance.now();

        let frame: number;

        const animate = (time: number) => {
            const t = Math.min(1, (time - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // smooth cubic ease-out

            setDisplayScore(targetScore * eased);
            setDisplayConfidence(targetConf * eased);

            if (t < 1) {
                frame = requestAnimationFrame(animate);
            }
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [normalized, confNorm]);

    const scorePercent = displayScore.toFixed(1);
    const confPercent = displayConfidence.toFixed(1);

    const fallbackQuotes: Record<RiskLevel, string> = {
        low: "Keep nurturing your calm — consistency builds strength.",
        medium: "Notice your triggers early — small wins matter.",
        high: "You are stronger than your urges — pause, breathe, choose.",
    };

    const shownQuote = quote || fallbackQuotes[band];

    return (
        <Card risk={band} className={className} compact={compact}>
            <Title compact={compact}>Relapse Risk Summary</Title>
            <RiskLabel compact={compact}>{band.toUpperCase()}</RiskLabel>

            <ScoreLine compact={compact}>
                Score: <b>{scorePercent}%</b>
            </ScoreLine>

            <ConfidenceWrapper>
                <ConfidenceHeader>
                    <span>Confidence</span>
                    <span>{confPercent}%</span>
                </ConfidenceHeader>
                <ConfidenceBarTrack>
                    <ConfidenceBar width={displayConfidence} />
                </ConfidenceBarTrack>
            </ConfidenceWrapper>

            {shownQuote && <QuoteText compact={compact}>“{shownQuote}”</QuoteText>}
            <ModelInfo compact={compact}>
                Model: {model_version || "v1.0.0"}
            </ModelInfo>
        </Card>
    );
};

export default RiskResultCard;
