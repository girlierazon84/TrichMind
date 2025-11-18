// client/src/components/RiskResultCard.tsx
import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";

/* ---------------------------------------------------------
    🧠 Local PredictResponse type
    (independent from DailyProgressCard)
--------------------------------------------------------- */
export interface PredictResponse {
    risk_score: number;        // 0..1
    risk_bucket: "low" | "medium" | "high";
    confidence: number;        // 0..1
    model_version?: string;
}

/* ---------------------------------------------------------
    🌀 Animations
--------------------------------------------------------- */
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const auraPulse = keyframes`
    0%   { opacity: 0.45; transform: scale(0.96); }
    50%  { opacity: 0.85; transform: scale(1.02); }
    100% { opacity: 0.45; transform: scale(0.96); }
`;

const borderGlow = keyframes`
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

/* ---------------------------------------------------------
    🎨 Styled Components
--------------------------------------------------------- */
type RiskLevel = "low" | "medium" | "high";

const Card = styled.div<{ $risk: RiskLevel; $compact?: boolean }>`
    position: relative;
    padding: ${({ $compact }) => ($compact ? "1.3rem" : "2rem")};
    border-radius: ${({ theme }) => theme.radius.lg};
    text-align: center;
    animation: ${fadeIn} 0.45s ease-out;

    background: ${({ theme }) => theme.colors.card_bg};
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);

    ${({ theme, $risk }) => {
        const gradient =
            $risk === "low"
                ? theme.colors.low_risk_gradient
                : $risk === "medium"
                ? theme.colors.medium_risk_gradient
                : theme.colors.high_risk_gradient;

        return css`
            border: 2px solid transparent;
            background-image:
                linear-gradient(${gradient}),
                linear-gradient(${theme.colors.card_bg});
            background-origin: border-box;
            background-clip: padding-box, border-box;
            animation: ${borderGlow} 4.5s ease infinite;

            &::before {
                content: "";
                position: absolute;
                z-index: -1;
                inset: -18px;
                border-radius: inherit;
                background: ${gradient};
                filter: blur(32px);
                opacity: 0.55;
                animation: ${auraPulse} 4s infinite ease-in-out;
            }

            &::after {
                content: "";
                position: absolute;
                inset: -28px;
                z-index: -2;
                border-radius: inherit;
                background: ${gradient};
                filter: blur(48px);
                opacity: 0.25;
            }
        `;
    }}
`;

const Title = styled.h3<{ $compact?: boolean }>`
    font-size: ${({ $compact }) => ($compact ? "1rem" : "1.35rem")};
    font-weight: 700;
    margin-bottom: 0.5rem;
`;

const RiskLabel = styled.div<{ $compact?: boolean; $risk: RiskLevel }>`
    font-size: ${({ $compact }) => ($compact ? "1.4rem" : "2rem")};
    font-weight: 800;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 1px;

    ${({ $risk }) =>
        $risk === "low"
            ? "color:#066e3c;"
            : $risk === "medium"
            ? "color:#8a4b14;"
            : "color:#a51010;"}
`;

const ScoreLine = styled.div<{ $compact?: boolean }>`
    font-size: ${({ $compact }) => ($compact ? "0.9rem" : "1rem")};
    margin-bottom: 0.8rem;

    b {
        font-size: ${({ $compact }) => ($compact ? "1rem" : "1.15rem")};
    }
`;

const ConfidenceWrapper = styled.div`
    width: 100%;
    max-width: 260px;
    margin: 0.5rem auto 0;
`;

const ConfidenceHeader = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    margin-bottom: 0.3rem;
    opacity: 0.85;
`;

const ConfidenceTrack = styled.div`
    height: 8px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
`;

const ConfidenceBar = styled.div<{ w: number; $risk: RiskLevel }>`
    height: 8px;
    border-radius: 9999px;
    width: ${({ w }) => w}%;
    transition: width 0.7s ease-out;

    ${({ $risk }) =>
        $risk === "low"
            ? "background:#0bb95d;"
            : $risk === "medium"
            ? "background:#ff9c35;"
            : "background:#ff3438;"}
`;

const Quote = styled.p<{ $compact?: boolean }>`
    margin-top: 1rem;
    font-style: italic;
    opacity: 0.85;
    font-size: ${({ $compact }) => ($compact ? "0.78rem" : "0.9rem")};
`;

const ModelInfo = styled.div`
    margin-top: 0.8rem;
    font-size: 0.7rem;
    opacity: 0.65;
`;

/* ---------------------------------------------------------
    🧠 Component
--------------------------------------------------------- */
export const RiskResultCard: React.FC<{
    data: PredictResponse;
    compact?: boolean;
    quote?: string;
}> = ({ data, compact = false, quote }) => {
    const { risk_bucket, risk_score, confidence, model_version } = data;

    const band: RiskLevel = risk_bucket.toLowerCase() as RiskLevel;

    const [score, setScore] = useState(0);
    const [conf, setConf] = useState(0);

    useEffect(() => {
        const duration = 900;
        const start = performance.now();

        const targetScore = risk_score * 100;
        const targetConf = confidence * 100;

        let frame: number;

        const animate = (time: number) => {
            const t = Math.min(1, (time - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);

            setScore(targetScore * eased);
            setConf(targetConf * eased);

            if (t < 1) {
                frame = requestAnimationFrame(animate);
            }
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [risk_score, confidence]);

    const fallback = {
        low: "Your calm foundation is strong — keep nurturing it 🌿",
        medium: "Small mindful choices today shape your tomorrow ✨",
        high: "Pause. Breathe. You are in control, even now ❤️",
    };

    return (
        <Card $risk={band} $compact={compact}>
            <Title $compact={compact}>Relapse Risk Summary</Title>

            <RiskLabel $risk={band} $compact={compact}>
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
    );
};

export default RiskResultCard;
