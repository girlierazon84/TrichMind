// client/src/components/RiskForecastTable.tsx

import React from "react";
import styled, { keyframes } from "styled-components";
import { usePredictedRiskTrend } from "@/hooks";
import InsightsIcon from "@/assets/icons/insights.png";

/* ---------------- Animations ---------------- */
const slideUp = keyframes`
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/* ---------------- Styled Components ---------------- */
const TableWrapper = styled.div`
    width: 100%;
    max-width: 960px;
    margin: 0 auto 2rem;

    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: ${({ theme }) => theme.spacing(4)};

    box-shadow: 0 16px 40px #0d6275;
    animation: ${slideUp} 0.5s ease-out;
    transform-style: preserve-3d;
`;

const HeaderRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
`;

const Icon = styled.img`
    width: 20px;
    height: 20px;
`;

const Title = styled.h3`
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const GridRow = styled.div`
    display: grid;
    grid-template-columns: 80px 1fr;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);

    &:last-child {
        border-bottom: none;
    }
`;

const DayLabel = styled.div`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const RiskValue = styled.div<{ score: number }>`
    font-weight: 600;
    font-size: 0.95rem;
    color: ${({ score, theme }) =>
        score > 70
            ? theme.colors.high_risk
            : score > 40
                ? theme.colors.medium_risk
                : theme.colors.low_risk};
`;

/**-------------------------------------------------------
    Component to display a 14-day risk forecast table.
----------------------------------------------------------*/
export const RiskForecastTable: React.FC = () => {
    const { trend, loading, error } = usePredictedRiskTrend(14);

    if (loading) return <p>Loading forecast...</p>;
    if (error) return <p>{error}</p>;
    if (!trend.length) return <p>No forecast data available yet.</p>;

    return (
        <TableWrapper>
            <HeaderRow>
                <Icon src={InsightsIcon} alt="Insights icon" />
                <Title>14-Day Risk Forecast</Title>
            </HeaderRow>

            {trend.map((t) => {
                const score = Math.round(t.predicted_risk * 100);
                return (
                    <GridRow key={t.day}>
                        <DayLabel>Day {t.day}</DayLabel>
                        <RiskValue score={score}>{score}%</RiskValue>
                    </GridRow>
                );
            })}
        </TableWrapper>
    );
};

export default RiskForecastTable;
