// client/src/components/RiskCard.tsx
import React from "react";
import styled, { keyframes, css } from "styled-components";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface RiskCardProps {
    score?: number | string;
    risk_score?: number | string;
    bucket?: string;
    quote?: string;
    confidence?: number | string;
    features?: Record<string, any>;
    className?: string;
}

/** Convert safely to number */
const toNum = (v: unknown): number | undefined => {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

/** Clamp between 0 and 1 */
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

/* 🎨 Color Themes */
const levelColors = {
    low: {
        bg: "#d1fae5",
        text: "#065f46",
        bar: "#2ecc71",
        glow: "#6ee7b7",
    },
    medium: {
        bg: "#fef9c3",
        text: "#78350f",
        bar: "#f1c40f",
        glow: "#fde68a",
    },
    high: {
        bg: "#fee2e2",
        text: "#7f1d1d",
        bar: "#e74c3c",
        glow: "#fca5a5",
    },
};

/* 🧩 Styled Components */
const Card = styled.div<{ risk: Lowercase<RiskLevel> }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-radius: 20px;
    padding: 1.5rem;
    background: ${({ risk }) => levelColors[risk].bg};
    color: ${({ risk }) => levelColors[risk].text};
    box-shadow: 0 4px 10px ${({ risk }) => levelColors[risk].glow};
    animation: ${fadeIn} 0.5s ease-in-out;
    transition: all 0.3s ease-in-out;
    ${({ risk }) =>
        risk === "high" &&
        css`
        animation: ${fadeIn} 0.5s ease-in-out, ${pulseHigh} 2.5s infinite ease-in-out;
    `}
`;

const Title = styled.h2`
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
`;

const Level = styled.div`
    font-size: 2.2rem;
    font-weight: 700;
    margin-bottom: 0.3rem;
    animation: ${fadeIn} 0.6s ease-in-out;
`;

const Score = styled.div`
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    b {
        font-size: 1.1rem;
    }
`;

const Confidence = styled.div`
    width: 100%;
    max-width: 250px;
    margin-bottom: 0.8rem;
`;

const ConfidenceHeader = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    margin-bottom: 0.2rem;
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
    font-size: 0.75rem;
    font-style: italic;
    color: #4b5563;
    margin-top: 0.4rem;
    animation: ${fadeIn} 0.7s ease-in-out;
`;

/* 🌟 Component Logic */
export const RiskCard: React.FC<RiskCardProps> = ({
    score,
    risk_score,
    bucket,
    quote,
    confidence,
    className,
}) => {
    const rawScore = toNum(score ?? risk_score);
    const normalized =
        rawScore === undefined
            ? undefined
            : rawScore > 1
                ? clamp01(rawScore / 10)
                : clamp01(rawScore);

    const normalizedConf =
        confidence === undefined ? undefined : clamp01(toNum(confidence) ?? 0);

    const risk: RiskLevel =
        (bucket?.toUpperCase() as RiskLevel) ||
        (normalized !== undefined
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

            {normalized !== undefined && (
                <Score>
                    Score: <b>{(normalized * 100).toFixed(1)}%</b>
                </Score>
            )}

            {normalizedConf !== undefined && (
                <Confidence>
                    <ConfidenceHeader>
                        <span>Confidence</span>
                        <span>{(normalizedConf * 100).toFixed(1)}%</span>
                    </ConfidenceHeader>
                    <ConfidenceBarWrapper>
                        <ConfidenceBar
                            width={normalizedConf * 100}
                            color={colors.bar}
                        />
                    </ConfidenceBarWrapper>
                </Confidence>
            )}

            {chosenQuote && <Quote>“{chosenQuote}”</Quote>}
        </Card>
    );
};

export default RiskCard;
