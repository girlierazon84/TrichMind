// client/src/components/RiskResultCard.tsx

import React from "react";
import styled, { keyframes, css } from "styled-components";

/** If you already export PredictResponse from your hook, feel free to import it:
 *   import { PredictResponse } from "@/hooks/usePredict";
 * To keep this component standalone, we define the minimal shape here.
 */
export interface PredictResponse {
    risk_score: number;        // 0..1
    risk_bucket: string;       // "low" | "medium" | "high" (case-insensitive)
    risk_code: number;         // 0 / 1 / 2
    confidence: number;        // 0..1
    model_version: string;
}

export type RiskResultVariant = "simple" | "detailed";

interface RiskResultCardProps {
    data: PredictResponse;
    variant?: RiskResultVariant;
    /** Optional custom quote for "detailed" variant */
    quote?: string;
    className?: string;
}

/* ────────────────────────────────────────────
    Helpers
───────────────────────────────────────────── */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const toNum = (v: unknown): number | undefined => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

const pickRiskFrom = (risk_bucket?: string, score?: number): RiskLevel => {
    if (risk_bucket) {
        const up = risk_bucket.toUpperCase();
        if (up === "LOW" || up === "MEDIUM" || up === "HIGH") return up as RiskLevel;
    }
    // derive from score if bucket not reliable
    if (typeof score === "number") {
        const s = clamp01(score);
        if (s < 0.3) return "LOW";
        if (s < 0.7) return "MEDIUM";
        return "HIGH";
    }
    return "MEDIUM";
};

/* ────────────────────────────────────────────
    Animations & Colors (for detailed variant)
───────────────────────────────────────────── */
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const pulseHigh = keyframes`
    0%, 100% { box-shadow: 0 0 15px rgba(231, 76, 60, 0.3); }
    50%      { box-shadow: 0 0 25px rgba(231, 76, 60, 0.6); }
`;

const levelColors = {
    low: { bg: "#d1fae5", text: "#065f46", bar: "#22c55e" },
    medium: { bg: "#fef9c3", text: "#78350f", bar: "#f59e0b" },
    high: { bg: "#fee2e2", text: "#7f1d1d", bar: "#ef4444" },
};

/* ────────────────────────────────────────────
    Styled blocks used by both variants
───────────────────────────────────────────── */
const BaseCard = styled.div`
    margin-top: ${({ theme }) => theme.spacing(8)};
    background: ${({ theme }) => theme.colors.card_bg};
    padding: ${({ theme }) => theme.spacing(8)};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
`;

const Title = styled.h3`
    margin: 0 0 ${({ theme }) => theme.spacing(4)} 0;
    font-size: 1.2rem;
    font-weight: 600;
`;

/* ────────────────────────────────────────────
    Simple variant styles (old ResultCard)
───────────────────────────────────────────── */
const SimpleRow = styled.div`
    margin: ${({ theme }) => theme.spacing(2)} 0;
    font-size: 0.95rem;
`;

/* ────────────────────────────────────────────
    Detailed variant styles (old RiskCard)
───────────────────────────────────────────── */
const DetailedCard = styled(BaseCard) <{ risk: Lowercase<RiskLevel> }>`
    background: ${({ risk }) => levelColors[risk].bg};
    color: ${({ risk }) => levelColors[risk].text};
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    animation: ${fadeIn} 0.4s ease-in-out;

    ${({ risk }) =>
        risk === "high" &&
        css`
        animation: ${fadeIn} 0.4s ease-in-out, ${pulseHigh} 2.5s infinite ease-in-out;
    `}
`;

const BigLevel = styled.div`
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const ScoreLine = styled.div`
    font-size: 0.95rem;
    margin-bottom: ${({ theme }) => theme.spacing(4)};
    b { font-size: 1.1rem; }
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
    Component
───────────────────────────────────────────── */
export const RiskResultCard: React.FC<RiskResultCardProps> = ({
    data,
    variant = "detailed",
    quote,
    className,
}) => {
    const rawScore = toNum(data.risk_score);
    const normalized = rawScore == null ? undefined : clamp01(rawScore);
    const conf = toNum(data.confidence);
    const confidence = conf == null ? undefined : clamp01(conf);
    const risk: RiskLevel = pickRiskFrom(data.risk_bucket, normalized);
    const band = risk.toLowerCase() as Lowercase<RiskLevel>;

    const quotes: Record<RiskLevel, string> = {
        LOW: "Keep nurturing your calm — consistency builds strength.",
        MEDIUM: "Notice your triggers early — small wins matter.",
        HIGH: "You are stronger than your urges — pause, breathe, choose.",
    };
    const chosenQuote = quote || quotes[risk];

    if (variant === "simple") {
        // Minimal, dev/admin-friendly summary (old ResultCard)
        return (
            <BaseCard className={className}>
                <Title>Prediction</Title>
                <SimpleRow>
                    Risk score: {normalized != null ? normalized.toFixed(2) : "—"}
                </SimpleRow>
                <SimpleRow>Bucket: {risk}</SimpleRow>
                <SimpleRow>
                    Confidence: {confidence != null ? confidence.toFixed(2) : "—"}
                </SimpleRow>
                <SimpleRow>Model: {data.model_version}</SimpleRow>
            </BaseCard>
        );
    }

    // Detailed, user-facing card (old RiskCard)
    const colors = levelColors[band];
    return (
        <DetailedCard className={className} risk={band}>
            <Title>Relapse Risk Prediction</Title>
            <BigLevel>{risk}</BigLevel>

            {normalized != null && (
                <ScoreLine>
                    Score: <b>{(normalized * 100).toFixed(1)}%</b>
                </ScoreLine>
            )}

            {confidence != null && (
                <Confidence>
                    <ConfidenceHeader>
                        <span>Confidence</span>
                        <span>{(confidence * 100).toFixed(1)}%</span>
                    </ConfidenceHeader>
                    <ConfidenceBarWrapper>
                        <ConfidenceBar width={confidence * 100} color={colors.bar} />
                    </ConfidenceBarWrapper>
                </Confidence>
            )}

            {chosenQuote && <Quote>“{chosenQuote}”</Quote>}
        </DetailedCard>
    );
};

export default RiskResultCard;
