// client/src/components/RiskCard.tsx

import React from "react";
import styled, { keyframes, css } from "styled-components";
import { PredictResponse } from "@/hooks/usePredict";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface RiskCardProps extends Partial<PredictResponse> {
    quote?: string;
    className?: string;
}

/* ────────────────────────────────────────────
    Helpers
───────────────────────────────────────────── */
const toNum = (v: unknown): number | undefined => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ✨ Animations */
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
`;
const pulseHigh = keyframes`
    0%, 100% { box-shadow: 0 0 15px rgba(231, 76, 60, 0.3); }
    50% { box-shadow: 0 0 25px rgba(231, 76, 60, 0.6); }
`;

/* 🎨 Risk color palette (mapped to theme tones) */
const levelColors = {
    low: { bg: "#d1fae5", text: "#065f46", bar: "#22c55e" },
    medium: { bg: "#fef9c3", text: "#78350f", bar: "#f59e0b" },
    high: { bg: "#fee2e2", text: "#7f1d1d", bar: "#ef4444" },
};

/* ────────────────────────────────────────────
    Styled Components
───────────────────────────────────────────── */
const Card = styled.div<{ risk: Lowercase<RiskLevel> }>`
    margin-top: ${({ theme }) => theme.spacing(8)};
    background: ${({ risk }) => levelColors[risk].bg};
    padding: ${({ theme }) => theme.spacing(8)};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    color: ${({ risk }) => levelColors[risk].text};
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    animation: ${fadeIn} 0.4s ease-in-out;
    transition: all 0.3s ease-in-out;

    ${({ risk }) =>
        risk === "high" &&
        css`
        animation: ${fadeIn} 0.5s ease-in-out, ${pulseHigh} 2.5s infinite ease-in-out;
    `}
`;

const Title = styled.h3`
    margin: 0 0 ${({ theme }) => theme.spacing(4)} 0;
    font-size: 1.2rem;
    font-weight: 600;
`;

const Level = styled.div`
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const Score = styled.div`
    font-size: 0.95rem;
    margin-bottom: ${({ theme }) => theme.spacing(4)};
    b {
        font-size: 1.1rem;
    }
`;

const Confidence = styled.div`
    width: 100%;
    max-width: 260px;
    margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const ConfidenceHeader = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    margin-bottom: 0.3rem;
`;

const ConfidenceBarWrapper = styled.div`
    background: #e5e7eb;
    border-radius: 9999px;
    height: 8px;
    overflow: hidden;
`;

const ConfidenceBar = styled.div<{ width: number; color: string }>`
    height: 8px;
    width: ${({ width }) => width}%;
    background: ${({ color }) => color};
    border-radius: 9999px;
    transition: width 0.4s ease-in-out;
`;

const Quote = styled.p`
    font-size: 0.8rem;
    font-style: italic;
    color: ${({ theme }) => theme.colors.text_secondary};
    margin-top: ${({ theme }) => theme.spacing(2)};
    animation: ${fadeIn} 0.6s ease-in-out;
`;

/* ────────────────────────────────────────────
    Component Logic
───────────────────────────────────────────── */
export const RiskCard: React.FC<RiskCardProps> = ({
    risk_score,
    risk_bucket,
    confidence,
    quote,
    className,
}) => {
    const rawScore = toNum(risk_score);
    const normalized =
        rawScore == null ? undefined : rawScore > 1 ? clamp01(rawScore / 10) : clamp01(rawScore);
    const conf = confidence == null ? undefined : clamp01(toNum(confidence) ?? 0);

    const risk: RiskLevel =
        (risk_bucket?.toUpperCase() as RiskLevel) ||
        (normalized != null
            ? normalized < 0.3
                ? "LOW"
                : normalized < 0.7
                    ? "MEDIUM"
                    : "HIGH"
            : "MEDIUM");

    const band = risk.toLowerCase() as Lowercase<RiskLevel>;

    const quotes: Record<RiskLevel, string> = {
        LOW: "Keep nurturing your calm — consistency builds strength.",
        MEDIUM: "Notice your triggers early — small wins matter.",
        HIGH: "You are stronger than your urges — pause, breathe, choose.",
    };

    const chosenQuote = quote || quotes[risk];
    const colors = levelColors[band];

    return (
        <Card risk={band} className={className}>
            <Title>Relapse Risk Prediction</Title>
            <Level>{risk}</Level>

            {normalized != null && (
                <Score>
                    Score: <b>{(normalized * 100).toFixed(1)}%</b>
                </Score>
            )}

            {conf != null && (
                <Confidence>
                    <ConfidenceHeader>
                        <span>Confidence</span>
                        <span>{(conf * 100).toFixed(1)}%</span>
                    </ConfidenceHeader>
                    <ConfidenceBarWrapper>
                        <ConfidenceBar width={conf * 100} color={colors.bar} />
                    </ConfidenceBarWrapper>
                </Confidence>
            )}

            {chosenQuote && <Quote>“{chosenQuote}”</Quote>}
        </Card>
    );
};

export default RiskCard;
