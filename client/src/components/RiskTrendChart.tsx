// client/src/components/RiskTrendChart.tsx

import React from "react";
import styled, { useTheme } from "styled-components";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { useRiskTrendChart } from "@/hooks";

// ──────────────────────────────
// Styled Components
// ──────────────────────────────
const ChartWrapper = styled.div`
    width: 100%;
    height: 340px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 16px;
    padding: 1rem 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
`;

const ChartTitle = styled.h3`
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const ErrorText = styled.p`
    color: ${({ theme }) => theme.colors.high_risk};
    font-weight: 500;
    text-align: center;
    margin-top: 1rem;
`;

const Message = styled.p`
    color: ${({ theme }) => theme.colors.text_secondary};
    text-align: center;
    margin-top: 2rem;
`;

// ──────────────────────────────
export const RiskTrendChart: React.FC = () => {
    const { data, loading, error } = useRiskTrendChart();
    const theme = useTheme();

    if (loading) return <Message>Loading risk trend...</Message>;
    if (error) return <ErrorText>⚠️ {error}</ErrorText>;
    if (!data.length) return <Message>No trend data available yet.</Message>;

    return (
        <ChartWrapper>
            <ChartTitle>📈 Relapse Risk Trend</ChartTitle>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    {/* SVG gradient that uses theme colors */}
                    <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                            {/* High risk near the top */}
                            <stop offset="0%" stopColor={theme.colors.high_risk} stopOpacity={0.9} />
                            {/* Medium mid-way */}
                            <stop offset="50%" stopColor={theme.colors.medium_risk} stopOpacity={0.85} />
                            {/* Low toward the bottom */}
                            <stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0.75} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

                    <XAxis
                        dataKey="date"
                        tickFormatter={(v: string) =>
                            new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                        }
                        stroke={theme.colors.text_secondary}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v: number) => `${v}%`}
                        stroke={theme.colors.text_secondary}
                    />

                    <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Risk Score"]}
                        labelFormatter={(label: string) =>
                            new Date(label).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })
                        }
                    />

                    <Line
                        type="monotone"
                        dataKey="risk_score"
                        stroke="url(#riskGradient)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6, stroke: theme.colors.card_bg, strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export default RiskTrendChart;
