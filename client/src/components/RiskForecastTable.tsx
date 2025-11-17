// client/src/components/RiskForecastTable.tsx

import React from "react";
import styled from "styled-components";
import { usePredictedRiskTrend } from "@/hooks";

const TableWrapper = styled.div`
    margin-top: 2rem;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 16px;
    padding: 1rem 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
`;

const Title = styled.h3`
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: 80px 1fr;
    padding: 0.5rem 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.text_secondary};
    &:last-child { border-bottom: none; }
`;

const RiskValue = styled.div<{ score: number }>`
    font-weight: 600;
    color: ${({ score, theme }) =>
        score > 70 ? theme.colors.high_risk :
        score > 40 ? theme.colors.medium_risk :
        theme.colors.low_risk};
`;

export const RiskForecastTable: React.FC = () => {
    const { trend, loading, error } = usePredictedRiskTrend(14);

    if (loading) return <p>Loading forecast...</p>;
    if (error) return <p>{error}</p>;

    return (
        <TableWrapper>
            <Title>📅 14-Day Risk Forecast</Title>

            {trend.map((t) => {
                const score = Math.round(t.predicted_risk * 100);
                return (
                    <Grid key={t.day}>
                        <div>Day {t.day}</div>
                        <RiskValue score={score}>{score}%</RiskValue>
                    </Grid>
                );
            })}
        </TableWrapper>
    );
};

export default RiskForecastTable;
