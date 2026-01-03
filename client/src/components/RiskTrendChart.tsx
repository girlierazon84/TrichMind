// client/src/components/RiskTrendChart.tsx

"use client";

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
    type TooltipProps,
} from "recharts";
import Image from "next/image";
import { useRiskTrendChart } from "@/hooks";
import { InsightsIcon } from "@/assets/icons";


/**-------------------------------------
    Styled Components and Animations
----------------------------------------*/
// Slide-up animation for chart container
const slideUp = keyframes`
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// Fade-in animation for text elements
const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

/**-----------------------------------------------------------
    Interface for a single point in the risk history data.
--------------------------------------------------------------*/
export interface HistoryPoint {
    date: string;
    score: number; // 0–1 from backend
}

/**----------------------------------------------------------------
    Interface for a single row of data formatted for the chart.
-------------------------------------------------------------------*/
type ChartRow = {
    date: string;
    risk_score: number; // 0–100 for chart
};

// Styled container for the chart with responsive design
const ChartWrapper = styled.section`
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

// Header row containing icon and title
const HeaderRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
`;

// Chart title styling
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

// Error text styling
const ErrorText = styled.p`
    color: ${({ theme }) => theme.colors.high_risk};
    text-align: center;
    margin-top: 1rem;
    font-size: 0.85rem;
`;

// General message text styling
const Message = styled.p`
    color: ${({ theme }) => theme.colors.text_secondary};
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.85rem;
`;

/**--------------------
    Component Props
-----------------------*/
interface Props {
    history?: HistoryPoint[];
}

/**-------------------------
    Helpers & Formatters
----------------------------*/
function toNumber(value: unknown): number | null {
    // Convert value to number if possible, else return null
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

/**-------------------------------------------------
    Format date for X-axis ticks (e.g., "Jan 5")
----------------------------------------------------*/
function formatTickDate(v: string): string {
    // Parse date string and format
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return v;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**--------------------------------------------------------------
    Format full date for tooltip labels (e.g., "Jan 5, 2024")
-----------------------------------------------------------------*/
function formatFullDate(v: string): string {
    // Parse date string and format
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return v;
    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**-----------------------------
    RiskTrendChart Component
--------------------------------*/
export const RiskTrendChart: React.FC<Props> = ({ history }) => {
    // Theme for colors and styles
    const theme = useTheme();
    const { data: fetchedHistory, loading, error } = useRiskTrendChart();

    // Use provided history or fetched history
    const baseHistory = history ?? fetchedHistory;

    // Memoized chart data transformation
    const chartData: ChartRow[] = useMemo(
        () =>
            (baseHistory ?? []).map((item) => ({
                date: item.date,
                risk_score: item.score * 100,
            })),
        [baseHistory]
    );

    // Conditional rendering based on data state
    if (!history && loading) return <Message>Loading your trend data…</Message>;
    if (!history && error) return <ErrorText>⚠️ Failed to load your risk history.</ErrorText>;
    if (!chartData.length) {
        return (
            <Message>
                No trend data yet. Log a few check-ins to see your personal relapse risk history here.
            </Message>
        );
    }

    // Tooltip formatter for risk score display
    const tooltipFormatter: TooltipProps<number, string>["formatter"] = (value) => {
        // Format risk score with one decimal place and percentage sign
        const n = toNumber(value);
        const label = "Risk";
        if (n === null) return ["—", label];
        return [`${n.toFixed(1)}%`, label];
    };

    return (
        <ChartWrapper aria-label="Relapse risk history chart">
            <HeaderRow>
                <Image src={InsightsIcon} alt="Insights icon" width={20} height={20} />
                <ChartTitle>Your Relapse Risk History</ChartTitle>
            </HeaderRow>

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={theme.colors.high_risk} stopOpacity={0.9} />
                            <stop offset="50%" stopColor={theme.colors.medium_risk} stopOpacity={0.85} />
                            <stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0.75} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="2 2" stroke="#ddd" />

                    <XAxis
                        dataKey="date"
                        stroke={theme.colors.text_secondary}
                        tickMargin={6}
                        minTickGap={10}
                        tickFormatter={formatTickDate}
                    />

                    <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v: number) => `${v}%`}
                        stroke={theme.colors.text_secondary}
                        width={40}
                    />

                    {/* Accessibility: Recharts Tooltip is mouse/hover based; keep it but ensure labels are robust */}
                    <Tooltip
                        formatter={tooltipFormatter}
                        labelFormatter={formatFullDate}
                        contentStyle={{ borderRadius: 8, fontSize: "0.75rem" }}
                        labelStyle={{ fontSize: "0.75rem" }}
                    />

                    <Line
                        type="monotone"
                        dataKey="risk_score"
                        stroke="url(#riskGradient)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                        name="Risk"
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export default RiskTrendChart;
