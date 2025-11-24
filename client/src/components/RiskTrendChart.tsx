// client/src/components/RiskTrendChart.tsx

import React, { useMemo } from "react";
import styled, { keyframes, useTheme } from "styled-components";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
    ReferenceArea,
} from "recharts";
import { useRiskTrendChart, usePredictedRiskTrend } from "@/hooks";
import { InsightsIcon } from "@/assets/icons";

/* Animations */
const slideUp = keyframes`
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

// Local Types
export interface HistoryPoint {
    date: string;
    score: number;
}

interface PastPoint {
    date: string;
    risk_score: number;
    type: "past";
}

interface FuturePoint {
    date: string;
    risk_score: number;
    type: "future";
}

interface PredictionPoint {
    day: number;
    predicted_risk: number;
}

type MergedPoint = PastPoint | FuturePoint;

// Tooltip helper types
type TooltipValue = number | string;
type TooltipName = string;
interface TooltipItem {
    payload?: MergedPoint;
}

/* Styled Components - mobile first */
const ChartWrapper = styled.div`
    perspective: 900px;
    width: 100%;
    max-width: 960px;
    margin: 2rem 0 0 0;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: ${({ theme }) => theme.spacing(3)};
    box-shadow: 0 10px 28px rgba(13, 98, 117, 0.65);
    display: flex;
    flex-direction: column;
    animation: ${slideUp} 0.6s ease-out;
    overflow: hidden;

    & .recharts-cartesian-axis-tick-value {
        font-size: 0.6rem;
    }

    @media (min-width: 480px) {
        height: 240px;
        padding: ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(4)};
    }

    @media (min-width: 768px) {
        max-width: 460px;
        height: 260px;
        margin: 0 1.5rem 2rem;
    }
`;

const HeaderRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
`;

const Icon = styled.img`
    width: 20px;
    height: 20px;
`;

const ChartTitle = styled.h3`
    font-size: 0.8rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text_primary};
    margin: 0;
    animation: ${fadeIn} 0.6s ease-out;

    @media (min-width: 480px) {
        font-size: 0.9rem;
    }
`;

const ErrorText = styled.p`
    color: ${({ theme }) => theme.colors.high_risk};
    text-align: center;
    margin-top: 1rem;
    font-size: 0.85rem;
`;

const Message = styled.p`
    color: ${({ theme }) => theme.colors.text_secondary};
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.85rem;
`;


// Main Component
export const RiskTrendChart: React.FC = () => {
    const theme = useTheme();

    const { data: history, loading: histLoading, error: histError } =
        useRiskTrendChart();

    const {
        trend: predicted,
        loading: predLoading,
        error: predError,
    } = usePredictedRiskTrend(14);

    const loading = histLoading || predLoading;
    const error = histError || predError;

    const { mergedData, forecastStartIndex } = useMemo(() => {
        const past: PastPoint[] = (history ?? []).map((item: HistoryPoint) => ({
            date: item.date,
            risk_score: item.score * 100,
            type: "past",
        }));

        const lastDate = past.length
            ? new Date(past[past.length - 1].date)
            : new Date();

        const future: FuturePoint[] = (predicted ?? []).map(
            (p: PredictionPoint, i) => {
                const d = new Date(lastDate);
                d.setDate(d.getDate() + (i + 1));
                return {
                    date: d.toISOString(),
                    risk_score: p.predicted_risk * 100,
                    type: "future",
                };
            }
        );

        const merged: MergedPoint[] = [...past, ...future];

        return {
            mergedData: merged,
            forecastStartIndex: past.length - 1,
        };
    }, [history, predicted]);

    if (loading) return <Message>Loading trend data...</Message>;
    if (error) return <ErrorText>⚠️ Failed to load risk trends.</ErrorText>;
    if (!mergedData.length) return <Message>No trend data available.</Message>;

    const forecastStartDate =
        mergedData[forecastStartIndex]?.date ?? mergedData[0].date;

    return (
        <ChartWrapper>
            <HeaderRow>
                <Icon src={InsightsIcon} alt="Insights icon" />
                <ChartTitle>
                    Combined Relapse Risk Trend (History + 14-Day Forecast)
                </ChartTitle>
            </HeaderRow>

            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={mergedData}
                    margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="0%"
                                stopColor={theme.colors.high_risk}
                                stopOpacity={0.9}
                            />
                            <stop
                                offset="50%"
                                stopColor={theme.colors.medium_risk}
                                stopOpacity={0.85}
                            />
                            <stop
                                offset="100%"
                                stopColor={theme.colors.primary}
                                stopOpacity={0.75}
                            />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="2 2" stroke="#ddd" />

                    <XAxis
                        className="x-axis"
                        dataKey="date"
                        stroke={theme.colors.text_secondary}
                        tickMargin={6}
                        minTickGap={10}
                        tickFormatter={(v: string) =>
                            new Date(v).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                            })
                        }
                    />

                    <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v: number) => `${v}%`}
                        stroke={theme.colors.text_secondary}
                        width={40}
                    />

                    {/* Forecast highlight area */}
                    <ReferenceArea
                        x1={forecastStartDate}
                        x2={mergedData[mergedData.length - 1].date}
                        fill={theme.colors.sixthly}
                        fillOpacity={0.12}
                    />

                    <Tooltip
                        formatter={(
                            value: TooltipValue,
                            _name: TooltipName,
                            item: TooltipItem
                        ) => {
                            const numeric =
                                typeof value === "number" ? value : Number(value);
                            const point = item.payload;
                            const label =
                                point?.type === "past" ? "Historical" : "Forecast";
                            return [`${numeric.toFixed(1)}%`, label];
                        }}
                        labelFormatter={(label: string) =>
                            new Date(label).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })
                        }
                        contentStyle={{
                            borderRadius: 8,
                            fontSize: "0.75rem",
                        }}
                        labelStyle={{ fontSize: "0.75rem" }}
                    />

                    <Legend
                        formatter={(value: string) =>
                            value === "past"
                                ? "Historical"
                                : value === "future"
                                ? "Forecast"
                                : value
                        }
                        wrapperStyle={{ fontSize: "0.75rem", paddingTop: 4 }}
                    />

                    {/* Past (solid line) */}
                    <Line
                        type="monotone"
                        dataKey="risk_score"
                        stroke="url(#riskGradient)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        name="past"
                        data={mergedData.filter((d) => d.type === "past")}
                        isAnimationActive={false}
                    />

                    {/* Future (dashed line) */}
                    <Line
                        type="monotone"
                        dataKey="risk_score"
                        stroke={theme.colors.medium_risk}
                        strokeDasharray="6 6"
                        strokeWidth={3}
                        dot={false}
                        name="future"
                        data={mergedData.filter((d) => d.type === "future")}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export default RiskTrendChart;
