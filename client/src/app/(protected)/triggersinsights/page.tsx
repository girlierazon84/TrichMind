// client/src/app/(protected)/triggersinsights/page.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useAuth } from "@/hooks";
import { journalApi, type JournalEntry } from "@/services";
import { TriggersInsightsIcon } from "@/assets/icons";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    Tooltip,
    CartesianGrid
} from "recharts";
import { HeaderAvatar } from "@/components/common";


interface UrgeTrendPoint {
    label: string;
    urgeIntensity: number;
}

interface TriggerView {
    name: string;
    frequency: number;
    recencyScore: number;
}

type RiskLabel = "Low" | "Moderate" | "High";

interface RiskSummary {
    score: number;
    label: RiskLabel;
    explanation: string;
}

interface JournalWithTriggers extends JournalEntry {
    preUrgeTriggers?: string[];
    createdAt?: string;
}

const PageWrapper = styled.main`
    width: 100%;
    min-height: 100vh;
    padding: 1.25rem 1.2rem 100px;
    background: linear-gradient(
        180deg,
        #e2f4f7 0%,
        #e6f7f7 120px,
        ${({ theme }) => theme.colors.page_bg || "#f4fbfc"} 300px
    );
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Content = styled.div`
    width: 100%;
    max-width: 960px;
`;

const Header = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
`;

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
`;

const HeaderIcon = styled.img`
    width: 32px;
    height: 32px;
`;

const HeaderTitleGroup = styled.div`
    display: flex;
    flex-direction: column;
`;

const HeaderTitle = styled.h1`
    font-size: 1.1rem;
    margin: 0;
    color: ${({ theme }) => theme.colors.text_primary};
    font-weight: 700;
`;

const HeaderSubtitle = styled.span`
    font-size: 0.55rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const Card = styled.section`
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 18px;
    padding: 1.1rem 1rem 1.2rem;
    box-shadow: 0 10px 28px rgba(13, 98, 117, 0.35);
    margin-bottom: 1.1rem;
`;

const SectionTitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
`;

const SectionTitle = styled.h3`
    font-size: 0.9rem;
    margin: 0;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const SectionSub = styled.p`
    margin: 0 0 0.6rem;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const EmptyState = styled.p`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    margin: 0.2rem 0 0.8rem;
`;

const TrendChartWrapper = styled.div`
    margin-top: 0.4rem;
    height: 180px;

    .recharts-cartesian-axis-tick-value {
        font-size: 0.6rem;
    }
`;

const RiskSummaryRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.8rem;
    margin-bottom: 0.35rem;

    span:first-child {
        font-weight: 500;
    }

    span:last-child {
        font-weight: 600;
    }
`;

const RiskBarTrack = styled.div`
    position: relative;
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, #43c6ac 0%, #ffd66b 50%, #ff6b81 100%);
    overflow: hidden;
`;

const RiskBarThumb = styled.div<{ $position: number }>`
    position: absolute;
    left: ${({ $position }) => `${$position * 100}%`};
    top: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.08);
`;

const RiskBarLabels = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    margin-top: 0.2rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const Table = styled.div`
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(255, 255, 255, 0.96);
`;

const TableHeaderRow = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr;
    background: ${({ theme }) => theme.colors.primary};
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.45rem 0.7rem;
`;

const TableRow = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr;
    font-size: 0.78rem;
    padding: 0.4rem 0.7rem;
    border-top: 1px solid rgba(0, 0, 0, 0.03);
`;

const TableCell = styled.span`
    &:last-child {
        text-align: right;
    }
`;

const WordCloudWrapper = styled.div`
    margin-top: 0.4rem;
    min-height: 80px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
`;

const Word = styled.span<{ $scale: number; $color: string }>`
    font-weight: 700;
    color: ${({ $color }) => $color};
    opacity: ${({ $scale }) => 0.4 + $scale * 0.6};
    font-size: ${({ $scale }) => 0.7 + $scale * 0.9}rem;
`;

const getTriggerColor = (recencyScore: number): string => {
    if (recencyScore < 0.33) return "#78909C";
    if (recencyScore < 0.66) return "#26A69A";
    return "#EC407A";
};

export default function InsightsPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const [trendData, setTrendData] = useState<UrgeTrendPoint[]>([]);
    const [triggersAggregated, setTriggersAggregated] = useState<TriggerView[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!isAuthenticated) router.replace("/login?next=/insights");
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchInsights = async () => {
            try {
                setLoading(true);

                const res = await journalApi.list({ page: 1, limit: 50, sort: "-createdAt" });
                const entries = (res?.entries ?? []) as JournalEntry[];

                const withUrgeAndDate = entries.filter(
                    (e): e is JournalEntry & { createdAt: string } =>
                        typeof e.urgeIntensity === "number" &&
                        typeof (e as JournalEntry & { createdAt?: string }).createdAt === "string"
                );

                const points: UrgeTrendPoint[] = withUrgeAndDate
                    .slice()
                    .reverse()
                    .map((e) => ({
                        label: new Date((e as JournalEntry & { createdAt: string }).createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                        }),
                        urgeIntensity: e.urgeIntensity ?? 0,
                    }));
                setTrendData(points);

                type TriggerAgg = { count: number; lastSeen: number };
                const triggerCounts = new Map<string, TriggerAgg>();

                (entries as JournalWithTriggers[]).forEach((entry) => {
                    const { preUrgeTriggers, createdAt } = entry;
                    if (!Array.isArray(preUrgeTriggers)) return;

                    let ts = 0;
                    if (typeof createdAt === "string") {
                        const time = new Date(createdAt).getTime();
                        if (!Number.isNaN(time)) ts = time;
                    }

                    preUrgeTriggers.forEach((rawName) => {
                        const name = rawName?.trim();
                        if (!name) return;

                        const existing = triggerCounts.get(name);
                        if (!existing) triggerCounts.set(name, { count: 1, lastSeen: ts });
                        else triggerCounts.set(name, { count: existing.count + 1, lastSeen: Math.max(existing.lastSeen, ts) });
                    });
                });

                const allAgg = Array.from(triggerCounts.entries());
                let minLastSeen = Infinity;
                let maxLastSeen = -Infinity;
                allAgg.forEach(([, v]) => {
                    minLastSeen = Math.min(minLastSeen, v.lastSeen);
                    maxLastSeen = Math.max(maxLastSeen, v.lastSeen);
                });

                const range = maxLastSeen > minLastSeen ? maxLastSeen - minLastSeen : 0;

                const aggregated: TriggerView[] = allAgg
                    .map(([name, v]) => {
                        let recencyScore = 0.5;
                        if (range > 0 && v.lastSeen > 0) recencyScore = (v.lastSeen - minLastSeen) / range;
                        return { name, frequency: v.count, recencyScore };
                    })
                    .sort((a, b) => b.frequency - a.frequency);

                setTriggersAggregated(aggregated);
            } catch {
                // quiet fail
            } finally {
                setLoading(false);
            }
        };

        void fetchInsights();
    }, [isAuthenticated]);

    const topTriggers = useMemo(() => triggersAggregated.slice(0, 5), [triggersAggregated]);
    const maxFrequency = useMemo(() => topTriggers.reduce((max, t) => Math.max(max, t.frequency), 0), [topTriggers]);

    const riskSummary: RiskSummary | null = useMemo(() => {
        if (trendData.length === 0 && topTriggers.length === 0) return null;

        const avgUrge =
            trendData.length > 0 ? trendData.reduce((sum, p) => sum + p.urgeIntensity, 0) / trendData.length : 0;

        const totalTriggerCount = topTriggers.reduce((sum, t) => sum + t.frequency, 0);

        const urgeComponent = Math.min(Math.max(avgUrge / 10, 0), 1);
        const triggerComponent = Math.min(totalTriggerCount / 20, 1);

        const score = Math.min(urgeComponent * 0.65 + triggerComponent * 0.35, 1);

        let label: RiskLabel = "Low";
        let explanation =
            "Your recent logs suggest a lower short-term relapse risk. Keep using your coping tools and check in regularly.";

        if (score >= 0.66) {
            label = "High";
            explanation =
                "Your recent urges and triggers look stronger. This can be a good moment to lean on coping strategies or support.";
        } else if (score >= 0.33) {
            label = "Moderate";
            explanation =
                "There are some active urges or triggers. Staying aware and using a few supports could be especially helpful.";
        }

        return { score, label, explanation };
    }, [trendData, topTriggers]);

    if (!isAuthenticated) return null;

    return (
        <PageWrapper>
            <Content>
                <Header>
                    <HeaderLeft>
                        <HeaderIcon src={TriggersInsightsIcon.src} alt="Triggers & Insights icon" />
                        <HeaderTitleGroup>
                            <HeaderTitle>Insights</HeaderTitle>
                            <HeaderSubtitle>Charts, trends and a gentle relapse-risk preview based on your logs.</HeaderSubtitle>
                        </HeaderTitleGroup>
                    </HeaderLeft>

                    <HeaderAvatar onClick={() => router.push("/profile")} />
                </Header>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Urge levels over time</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>A soft overview of how your urge intensity has been moving in your recent journal entries.</SectionSub>

                    {loading ? (
                        <EmptyState>Loading urge trend…</EmptyState>
                    ) : trendData.length < 2 ? (
                        <EmptyState>Add a few more journal entries with urge ratings to see your trend here.</EmptyState>
                    ) : (
                        <TrendChartWrapper>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="2 2" stroke="#dde" />
                                    <XAxis dataKey="label" tickMargin={4} />
                                    <Tooltip
                                        formatter={(v: number | undefined) => [`${(v ?? 0)}/10`, "Urge level"]}
                                        labelFormatter={(label: string) => label}
                                        contentStyle={{ borderRadius: 8, fontSize: "0.75rem" }}
                                        labelStyle={{ fontSize: "0.75rem" }}
                                    />
                                    <Line type="monotone" dataKey="urgeIntensity" stroke="#00b3c4" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </TrendChartWrapper>
                    )}
                </Card>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Relapse-risk preview</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        A simple visual based on your recent urge levels and how often triggers show up. This is for awareness only and is not medical advice.
                    </SectionSub>

                    {!riskSummary ? (
                        <EmptyState>Log a few more urges and triggers, and you’ll see a small relapse-risk preview here.</EmptyState>
                    ) : (
                        <>
                            <RiskSummaryRow>
                                <span>Current pattern (last entries)</span>
                                <span>{riskSummary.label} risk</span>
                            </RiskSummaryRow>
                            <RiskBarTrack>
                                <RiskBarThumb $position={riskSummary.score} />
                            </RiskBarTrack>
                            <RiskBarLabels>
                                <span>Low</span>
                                <span>Moderate</span>
                                <span>High</span>
                            </RiskBarLabels>
                            <SectionSub style={{ marginTop: "0.5rem" }}>{riskSummary.explanation}</SectionSub>
                        </>
                    )}
                </Card>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Top triggers</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>Based on your logs, these triggers show up the most.</SectionSub>

                    {loading ? (
                        <EmptyState>Loading triggers…</EmptyState>
                    ) : topTriggers.length === 0 ? (
                        <EmptyState>No trigger data yet. As you log moods and triggers in your Journal, they’ll appear here.</EmptyState>
                    ) : (
                        <Table>
                            <TableHeaderRow>
                                <span>Trigger</span>
                                <span>Frequency</span>
                            </TableHeaderRow>
                            {topTriggers.map((t) => (
                                <TableRow key={t.name}>
                                    <TableCell>{t.name}</TableCell>
                                    <TableCell>{t.frequency}</TableCell>
                                </TableRow>
                            ))}
                        </Table>
                    )}
                </Card>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Trigger word cloud</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>Bigger, bolder words = triggers that show up more often, especially if they’ve appeared recently.</SectionSub>

                    {topTriggers.length === 0 ? (
                        <EmptyState>Once you have some trigger data, you’ll see a simple word cloud here.</EmptyState>
                    ) : (
                        <WordCloudWrapper>
                            {topTriggers.map((t) => {
                                const freqScore = maxFrequency > 0 ? t.frequency / maxFrequency : 0;
                                const sizeScore = 0.6 * freqScore + 0.4 * t.recencyScore;
                                const scale = 0.3 + sizeScore * 0.7;
                                const color = getTriggerColor(t.recencyScore);

                                return (
                                    <Word key={t.name} $scale={scale} $color={color}>
                                        {t.name}
                                    </Word>
                                );
                            })}
                        </WordCloudWrapper>
                    )}
                </Card>
            </Content>
        </PageWrapper>
    );
}
