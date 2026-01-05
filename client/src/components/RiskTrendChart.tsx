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
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const slideUp = keyframes`
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

export interface HistoryPoint {
    date: string;
    score: number; // 0–1
}

type ChartRow = {
    date: string;
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
    Mobile-first UI
-----------------------*/
const Card = styled.section`
    width: 100%;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 14px;
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    border: 1px solid rgba(0, 0, 0, 0.06);
    animation: ${enter} 0.45s ease-out;

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
    font-weight: 850;
    color: ${({ theme }) => theme.colors.text_primary};
    letter-spacing: 0.01em;
`;

const Sub = styled.p`
    margin: 0;
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.text_secondary};

    strong {
        color: ${({ theme }) => theme.colors.text_primary};
        font-weight: 850;
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
    font-weight: 800;
`;

const StatValue = styled.div`
    margin-top: 4px;
    font-size: 1.02rem;
    color: ${({ theme }) => theme.colors.text_primary};
    font-weight: 900;
    display: flex;
    align-items: baseline;
    gap: 6px;
`;

const DeltaPill = styled.span<{ $dir: "up" | "down" | "flat" }>`
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 900;
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
    font-weight: 650;
`;

const Hint = styled.div`
    margin-top: 8px;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    text-align: center;
`;

/**-------------------------
    Pinned panel + badge
----------------------------*/
const PinnedPanel = styled.div`
    margin-top: 10px;
    border-radius: 16px;
    padding: 12px 12px;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.06);
    animation: ${slideUp} 0.28s ease-out;
`;

const PinnedTopRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
`;

const PinnedBadge = styled.span`
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 950;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    background: rgba(0, 0, 0, 0.06);
    color: ${({ theme }) => theme.colors.text_primary};
    border: 1px solid rgba(0, 0, 0, 0.08);
`;

const PinnedRow = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
`;

const PinnedLabel = styled.div`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const PinnedValue = styled.div`
    font-size: 1.05rem;
    font-weight: 950;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const ClearPin = styled.button`
    margin-top: 10px;
    width: 100%;
    border: none;
    border-radius: 14px;
    padding: 10px 12px;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.04);
    color: ${({ theme }) => theme.colors.text_primary};
    font-weight: 900;

    &:hover {
        background: rgba(0, 0, 0, 0.06);
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.primary};
        outline-offset: 2px;
    }
`;

/**-------------------------------
    Tooltip (no inline styles)
----------------------------------*/
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
    font-weight: 750;
`;

const TipValue = styled.span`
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.text_primary};
    font-weight: 900;
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

function formatTickDate(v: string): string {
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return v;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(v: string): string {
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return v;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function pct(n: number): string {
    return `${n.toFixed(1)}%`;
}

/**
 * Click state for Recharts CategoricalChart
 * (we avoid importing Recharts internal types to stay version-safe)
 */
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

function CustomTooltip({ active, label, payload }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;

    const raw = payload[0]?.value;
    const n = toNumber(raw);
    const valueText = n === null ? "—" : pct(n);

    return (
        <Tip role="status" aria-live="polite">
            <TipLabel>{label != null ? formatFullDate(String(label)) : "—"}</TipLabel>
            <TipRow>
                <TipName>Risk</TipName>
                <TipValue>{valueText}</TipValue>
            </TipRow>
        </Tip>
    );
}

/**-------------------------------------
  Component
--------------------------------------*/
interface Props {
    history?: HistoryPoint[];
}

export const RiskTrendChart: React.FC<Props> = ({ history }) => {
    const theme = useTheme();
    const primary = theme.colors.primary;
    const textSecondary = theme.colors.text_secondary;

    const { data: fetchedHistory, loading, error } = useRiskTrendChart();

    const baseHistory = history ?? fetchedHistory;

    const chartData: ChartRow[] = useMemo(
        () =>
            (baseHistory ?? []).map((item) => ({
                date: item.date,
                risk_score: item.score * 100,
            })),
        [baseHistory]
    );

    const isMini = chartData.length <= 3;

    // Tap-to-pin (great for mobile)
    const [pinned, setPinned] = useState<ChartRow | null>(null);

    const onChartClick = useCallback(
        (evt: unknown) => {
            if (!isChartClickState(evt)) return;

            const payloadRow = evt.activePayload?.[0]?.payload;
            const label = evt.activeLabel != null ? String(evt.activeLabel) : null;

            const next =
                payloadRow ?? (label ? chartData.find((d) => d.date === label) ?? null : null);

            if (!next) return;

            setPinned((prev) => (prev?.date === next.date ? null : next));
        },
        [chartData]
    );

    // ✅ IMPORTANT: this hook must be declared BEFORE any early return
    const dotRenderer = useCallback(
        (props: unknown) => {
            if (!props || typeof props !== "object") return null;
            const p = props as Record<string, unknown>;

            const cx = typeof p.cx === "number" ? p.cx : null;
            const cy = typeof p.cy === "number" ? p.cy : null;

            const payload = (p.payload ?? null) as ChartRow | null;
            if (cx === null || cy === null || !payload) return null;

            const isPinned = pinned?.date === payload.date;

            return (
                <circle
                    cx={cx}
                    cy={cy}
                    r={isPinned ? 5 : 2.6}
                    fill={isPinned ? primary : textSecondary}
                    opacity={isPinned ? 1 : 0.65}
                />
            );
        },
        [pinned, primary, textSecondary]
    );

    // ✅ now early returns are safe
    if (!history && loading) return <CenterMessage>Loading your trend…</CenterMessage>;
    if (!history && error) return <ErrorText>⚠️ Couldn’t load your risk history.</ErrorText>;
    if (!chartData.length) {
        return (
            <CenterMessage>
                No trend data yet. Add a few check-ins and your history will appear here.
            </CenterMessage>
        );
    }

    // Summary stats
    const latest = chartData[chartData.length - 1]?.risk_score ?? 0;
    const prev =
        chartData.length > 1 ? chartData[chartData.length - 2]?.risk_score ?? latest : latest;
    const delta = latest - prev;

    const deltaDir: "up" | "down" | "flat" =
        Math.abs(delta) < 0.05 ? "flat" : delta > 0 ? "up" : "down";

    const deltaText = chartData.length > 1 ? `${delta >= 0 ? "+" : ""}${pct(delta)}` : "—";

    const lastN = Math.min(7, chartData.length);
    const lastSlice = chartData.slice(-lastN);
    const avg7 =
        lastSlice.reduce(
            (acc, x) => acc + (Number.isFinite(x.risk_score) ? x.risk_score : 0),
            0
        ) / (lastSlice.length || 1);

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
                    <LineChart
                        data={chartData}
                        margin={{ top: 12, right: 10, left: isMini ? 0 : -10, bottom: 2 }}
                        onClick={onChartClick}
                    >
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
                            dot={isMini ? false : dotRenderer}
                            activeDot={{ r: 4.2 }}
                            isAnimationActive={false}
                            name="Risk"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartArea>

            <Hint>Tip: tap the chart to pin a datapoint (mobile-friendly).</Hint>

            {pinned && (
                <PinnedPanel role="status" aria-live="polite">
                    <PinnedTopRow>
                        <PinnedBadge>Pinned</PinnedBadge>
                        <PinnedLabel>{formatFullDate(pinned.date)}</PinnedLabel>
                    </PinnedTopRow>

                    <PinnedRow>
                        <PinnedLabel>Risk</PinnedLabel>
                        <PinnedValue>{pct(pinned.risk_score)}</PinnedValue>
                    </PinnedRow>

                    <ClearPin type="button" onClick={() => setPinned(null)}>
                        Clear pinned point
                    </ClearPin>
                </PinnedPanel>
            )}
        </Card>
    );
};

export default RiskTrendChart;
