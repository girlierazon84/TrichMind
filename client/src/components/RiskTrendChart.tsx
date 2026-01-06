// client/src/components/RiskTrendChart.tsx

"use client";

import React, { useMemo, useState, useCallback } from "react";
import styled, { keyframes, useTheme } from "styled-components";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import Image from "next/image";
import { useRiskTrendChart } from "@/hooks";
import { InsightsIcon } from "@/assets/icons";

/**---------------
    Animations
------------------*/
const enter = keyframes`
    from { opacity: 0; transform: translateY(12px) scale(0.985); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const shimmer = keyframes`
  0%   { transform: translateX(-30%) rotate(8deg); opacity: 0; }
  25%  { opacity: 0.16; }
  70%  { opacity: 0.12; }
  100% { transform: translateX(130%) rotate(8deg); opacity: 0; }
`;

export interface HistoryPoint {
    date: string;
    score: number; // 0–1
}

type ChartRow = {
    date: string; // normalized key for x-axis
    risk_score: number; // 0–100
};

type TooltipPayloadItem = {
    value?: number | string;
    name?: string;
    dataKey?: string;
    payload?: ChartRow;
};

type CustomTooltipProps = {
    active?: boolean;
    label?: string | number;
    payload?: TooltipPayloadItem[];
};

/**--------------------
    Modern card UI
-----------------------*/
const Card = styled.section`
    position: relative;
    width: 100%;
    overflow: hidden;

    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 14px;

    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 16px 40px rgba(13, 98, 117, 0.22);
    backdrop-filter: blur(6px);

    animation: ${enter} 0.45s ease-out;
    transition: transform 0.18s ease-out, box-shadow 0.22s ease-out;

    &::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.04) 35%,
            rgba(255, 255, 255, 0) 70%
        );
        pointer-events: none;
    }

    &::before {
        content: "";
        position: absolute;
        inset: -30% -40%;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.38) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        filter: blur(10px);
        opacity: 0;
        animation: ${shimmer} 6.2s ease-in-out infinite;
        pointer-events: none;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 52px rgba(13, 98, 117, 0.26);
    }

    @media (min-width: 768px) {
        padding: 16px;
    }

    .recharts-cartesian-axis-tick-value {
        font-size: 0.7rem;
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
`;

const IconWrap = styled.div`
    width: 34px;
    height: 34px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.06);
`;

const TitleBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

const Title = styled.h3`
    margin: 0;
    font-size: 0.95rem;
    font-weight: 950;
    color: ${({ theme }) => theme.colors.text_primary};
    letter-spacing: 0.01em;
`;

const Sub = styled.p`
    margin: 0;
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.text_secondary};

    strong {
        color: ${({ theme }) => theme.colors.text_primary};
        font-weight: 950;
    }
`;

const SummaryGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 10px 0 8px;

    @media (min-width: 520px) {
        grid-template-columns: 1fr 1fr 1fr 1fr;
    }
`;

const Stat = styled.div`
    border-radius: 14px;
    padding: 10px 10px;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.06);
`;

const StatLabel = styled.div`
    font-size: 0.72rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    letter-spacing: 0.02em;
    text-transform: uppercase;
    font-weight: 850;
`;

const StatValue = styled.div`
    margin-top: 4px;
    font-size: 1.02rem;
    color: ${({ theme }) => theme.colors.text_primary};
    font-weight: 950;
    display: flex;
    align-items: baseline;
    gap: 6px;
`;

const DeltaPill = styled.span<{ $dir: "up" | "down" | "flat" }>`
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 950;
    letter-spacing: 0.01em;
    border: 1px solid rgba(0, 0, 0, 0.06);

    background: ${({ $dir }) =>
        $dir === "up"
            ? "rgba(255, 173, 120, 0.18)"
            : $dir === "down"
                ? "rgba(120, 255, 190, 0.18)"
                : "rgba(0,0,0,0.04)"};

    color: ${({ theme, $dir }) =>
        $dir === "up"
            ? theme.colors.medium_risk_gradient || theme.colors.medium_risk
            : $dir === "down"
                ? theme.colors.low_risk_gradient || theme.colors.primary
                : theme.colors.text_secondary};
`;

const ChartArea = styled.div<{ $mini?: boolean }>`
    width: 100%;
    height: ${({ $mini }) => ($mini ? "150px" : "210px")};

    @media (min-width: 480px) {
        height: ${({ $mini }) => ($mini ? "165px" : "230px")};
    }

    @media (min-width: 900px) {
        height: ${({ $mini }) => ($mini ? "180px" : "250px")};
    }
`;

const CenterMessage = styled.p`
    margin: 0;
    padding: 14px 6px 0;
    text-align: center;
    color: ${({ theme }) => theme.colors.text_secondary};
    font-size: 0.9rem;
    line-height: 1.45;
`;

const ErrorText = styled(CenterMessage)`
    color: ${({ theme }) => theme.colors.high_risk};
    font-weight: 700;
`;

const Hint = styled.div`
    margin-top: 8px;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    text-align: center;
`;

const Tip = styled.div`
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 14px;
    padding: 10px 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
    min-width: 160px;
`;

const TipLabel = styled.div`
    font-size: 0.78rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    margin-bottom: 4px;
`;

const TipRow = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
`;

const TipName = styled.span`
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.text_primary};
    font-weight: 800;
`;

const TipValue = styled.span`
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.text_primary};
    font-weight: 950;
`;

/**------------
    Helpers
---------------*/
function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function parseDateSafe(v: string): Date | null {
    const s = String(v);
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
    const d = new Date(isDateOnly ? `${s}T12:00:00` : s);
    if (!Number.isFinite(d.getTime())) return null;
    return d;
}

function normalizeDateKey(v: string): string {
    const d = parseDateSafe(v);
    if (!d) return String(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatTickDate(v: string): string {
    const d = parseDateSafe(v);
    if (!d) return v;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(v: string): string {
    const d = parseDateSafe(v);
    if (!d) return v;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function pct(n: number): string {
    return `${n.toFixed(1)}%`;
}

type ChartClickState = {
    activeLabel?: string | number;
    activePayload?: Array<{ payload?: ChartRow }>;
};

function isChartClickState(x: unknown): x is ChartClickState {
    if (!x || typeof x !== "object") return false;
    const obj = x as Record<string, unknown>;
    if (!("activeLabel" in obj) && !("activePayload" in obj)) return false;
    return true;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;

    const pointDate = payload[0]?.payload?.date;
    const dateText = pointDate ? formatFullDate(String(pointDate)) : "—";

    const raw = payload[0]?.value;
    const n = toNumber(raw);
    const valueText = n === null ? "—" : pct(n);

    return (
        <Tip role="status" aria-live="polite">
            <TipLabel>{dateText}</TipLabel>
            <TipRow>
                <TipName>Risk</TipName>
                <TipValue>{valueText}</TipValue>
            </TipRow>
        </Tip>
    );
}

interface Props {
    history?: HistoryPoint[];
}

export const RiskTrendChart: React.FC<Props> = ({ history }) => {
    const theme = useTheme();
    const primary = theme.colors.primary;
    const textSecondary = theme.colors.text_secondary;

    const { data: fetchedHistory, loading, error } = useRiskTrendChart();
    const baseHistory = history ?? fetchedHistory;

    const chartData: ChartRow[] = useMemo(() => {
        const rows = (baseHistory ?? [])
            .map((item) => {
                const scoreNum = typeof item.score === "number" ? item.score : Number(item.score);
                if (!Number.isFinite(scoreNum)) return null;

                const dateKey = normalizeDateKey(item.date);
                const dt = parseDateSafe(dateKey);
                if (!dt) return null;

                return { date: dateKey, risk_score: scoreNum * 100 };
            })
            .filter((x): x is ChartRow => x !== null);

        rows.sort((a, b) => {
            const ta = parseDateSafe(a.date)?.getTime() ?? 0;
            const tb = parseDateSafe(b.date)?.getTime() ?? 0;
            return ta - tb;
        });

        return rows;
    }, [baseHistory]);

    const isMini = chartData.length <= 3;

    if (!history && loading) return <CenterMessage>Loading your trend…</CenterMessage>;
    if (!history && error) return <ErrorText>⚠️ Couldn’t load your risk history.</ErrorText>;
    if (!chartData.length) {
        return (
            <CenterMessage>
                No trend data yet. Add a few check-ins and your history will appear here.
            </CenterMessage>
        );
    }

    const latestRow = chartData[chartData.length - 1];
    const prevRow = chartData.length > 1 ? chartData[chartData.length - 2] : latestRow;

    const latest = latestRow?.risk_score ?? 0;
    const prev = prevRow?.risk_score ?? latest;
    const delta = latest - prev;

    const deltaDir: "up" | "down" | "flat" =
        Math.abs(delta) < 0.05 ? "flat" : delta > 0 ? "up" : "down";

    const deltaText = chartData.length > 1 ? `${delta >= 0 ? "+" : ""}${pct(delta)}` : "—";

    const lastN = Math.min(7, chartData.length);
    const lastSlice = chartData.slice(-lastN);
    const avg7 =
        lastSlice.reduce((acc, x) => acc + (Number.isFinite(x.risk_score) ? x.risk_score : 0), 0) /
        (lastSlice.length || 1);

    const best = chartData.reduce((min, x) => (x.risk_score < min ? x.risk_score : min), latest);
    const worst = chartData.reduce((max, x) => (x.risk_score > max ? x.risk_score : max), latest);

    return (
        <Card aria-label="Relapse risk history chart">
            <Header>
                <IconWrap>
                    <Image src={InsightsIcon} alt="Insights icon" width={18} height={18} />
                </IconWrap>

                <TitleBlock>
                    <Title>Risk trend</Title>
                    <Sub>
                        Latest: <strong>{pct(latest)}</strong> • Change: <strong>{deltaText}</strong>
                    </Sub>
                </TitleBlock>
            </Header>

            <SummaryGrid>
                <Stat>
                    <StatLabel>Latest</StatLabel>
                    <StatValue>
                        {pct(latest)} <DeltaPill $dir={deltaDir}>{deltaText}</DeltaPill>
                    </StatValue>
                </Stat>

                <Stat>
                    <StatLabel>{lastN}-day avg</StatLabel>
                    <StatValue>{pct(avg7)}</StatValue>
                </Stat>

                <Stat>
                    <StatLabel>Best</StatLabel>
                    <StatValue>{pct(best)}</StatValue>
                </Stat>

                <Stat>
                    <StatLabel>Worst</StatLabel>
                    <StatValue>{pct(worst)}</StatValue>
                </Stat>
            </SummaryGrid>

            <ChartArea $mini={isMini}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 12, right: 10, left: isMini ? 0 : -10, bottom: 2 }}>
                        <defs>
                            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={theme.colors.high_risk} stopOpacity={0.9} />
                                <stop offset="50%" stopColor={theme.colors.medium_risk} stopOpacity={0.85} />
                                <stop offset="100%" stopColor={primary} stopOpacity={0.75} />
                            </linearGradient>
                        </defs>

                        {!isMini && <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.10)" />}

                        {!isMini && (
                            <XAxis
                                dataKey="date"
                                stroke={textSecondary}
                                tickMargin={8}
                                minTickGap={16}
                                tickFormatter={formatTickDate}
                                axisLine={{ stroke: "rgba(0,0,0,0.10)" }}
                                tickLine={false}
                            />
                        )}

                        {!isMini && (
                            <YAxis
                                domain={[0, 100]}
                                tickFormatter={(v: number) => `${v}%`}
                                stroke={textSecondary}
                                width={40}
                                axisLine={{ stroke: "rgba(0,0,0,0.10)" }}
                                tickLine={false}
                            />
                        )}

                        <Tooltip content={<CustomTooltip />} />

                        <Line
                            type="monotone"
                            dataKey="risk_score"
                            stroke="url(#riskGradient)"
                            strokeWidth={isMini ? 3.2 : 3}
                            dot={isMini ? false : true}
                            activeDot={{ r: 4.2 }}
                            isAnimationActive={false}
                            name="Risk"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartArea>

            <Hint>Tip: your risk trend updates after new check-ins.</Hint>
        </Card>
    );
};

export default RiskTrendChart;
