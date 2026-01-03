// client/src/components/RiskForecastTable.tsx

"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import Image from "next/image";
import { usePredictedRiskTrend } from "@/hooks";
import { InsightsIcon } from "@/assets/icons";


/**--------------------------------------------
    Styled Components for RiskForecastTable
-----------------------------------------------*/
// Animation for sliding up the table on render
const slideUp = keyframes`
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// Wrapper for the entire table
const TableWrapper = styled.section`
    width: 100%;
    max-width: 960px;
    margin: 0 auto 2rem;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: ${({ theme }) => theme.spacing(4)};
    box-shadow: 0 16px 40px #0d6275;
    animation: ${slideUp} 0.5s ease-out;
`;

// Header row containing the icon and title
const HeaderRow = styled.div`
    display: flex;
    gap: 0.6rem;
    align-items: center;
`;

// Title styling
const Title = styled.h3`
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text_primary};
`;

// Individual grid row for each day's forecast
const GridRow = styled.div`
    display: grid;
    grid-template-columns: 80px 1fr;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);

    &:last-child {
        border-bottom: none;
    }
`;

// Day label styling
const DayLabel = styled.div`
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

// Risk value styling with dynamic color based on score
const RiskValue = styled.div<{ $score: number }>`
    font-weight: 600;
    font-size: 0.75rem;
    color: ${({ $score, theme }) =>
        $score > 70 ? theme.colors.high_risk : $score > 40 ? theme.colors.medium_risk : theme.colors.low_risk};
`;

/**--------------------------------
    RiskForecastTable Component
-----------------------------------*/
export const RiskForecastTable: React.FC = () => {
    // Fetch the predicted risk trend for the next 14 days
    const { trend, loading, error } = usePredictedRiskTrend(14);

    // Handle loading, error, and empty states
    if (loading) return <p aria-live="polite">Loading forecast…</p>;
    if (error) return <p role="alert">{error}</p>;
    if (!trend.length) return <p>No forecast data available yet.</p>;

    return (
        <TableWrapper aria-label="Fourteen-day risk forecast">
            <HeaderRow>
                <Image src={InsightsIcon} alt="" width={20} height={20} />
                <Title>14-Day Risk Forecast</Title>
            </HeaderRow>

            {trend.map((t) => {
                const score = Math.round(t.predicted_risk * 100);
                return (
                    <GridRow key={t.day}>
                        <DayLabel>Day {t.day}</DayLabel>
                        <RiskValue $score={score} aria-label={`Day ${t.day} predicted risk: ${score} percent`}>
                            {score}%
                        </RiskValue>
                    </GridRow>
                );
            })}
        </TableWrapper>
    );
};

export default RiskForecastTable;
