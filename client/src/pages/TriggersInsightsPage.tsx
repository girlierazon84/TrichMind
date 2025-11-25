// client/src/pages/TriggersInsightsPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { useAuth } from "@/hooks";
import { journalApi, type JournalEntry } from "@/services";

import { UserIcon, TriggersInsightsIcon } from "@/assets/icons";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

// ---------- Types ----------

interface UrgeTrendPoint {
    label: string;
    urgeIntensity: number;
}

interface TriggerView {
    name: string;
    frequency: number;
}

type RiskLabel = "Low" | "Moderate" | "High";

interface RiskSummary {
    score: number; // 0–1
    label: RiskLabel;
    explanation: string;
}

// JournalEntry extended with triggers field (optional – but now backed by BE)
interface JournalWithTriggers extends JournalEntry {
    preUrgeTriggers?: string[];
}

// ---------- Styled Components ----------

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
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const AvatarButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
`;

const AvatarImage = styled.img`
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
`;

// ---- Cards ----
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

// Chart container
const TrendChartWrapper = styled.div`
    margin-top: 0.4rem;
    height: 180px;

    .recharts-cartesian-axis-tick-value {
        font-size: 0.6rem;
    }
`;

// ---- Relapse risk visual ----
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

// ---- Top triggers table ----
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

// ---- Word cloud ----
const WordCloudWrapper = styled.div`
    margin-top: 0.4rem;
    min-height: 80px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
`;

const Word = styled.span<{ $scale: number }>`
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    opacity: ${({ $scale }) => 0.4 + $scale * 0.6};
    font-size: ${({ $scale }) => 0.7 + $scale * 0.9}rem;
`;

// ---------------- Component ----------------

export const TriggersInsightsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [trendData, setTrendData] = useState<UrgeTrendPoint[]>([]);
    const [triggersAggregated, setTriggersAggregated] = useState<TriggerView[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const headerAvatar = UserIcon;

    // Redirect guests to login
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    // Load urge trend + trigger frequencies from journal entries
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchInsights = async () => {
            try {
                setLoading(true);

                const res = await journalApi.list({
                    page: 1,
                    limit: 50,
                    sort: "-createdAt",
                });

                const entries = (res?.entries ?? []) as JournalEntry[];

                // Filter out entries that actually have an urge + createdAt
                const withUrgeAndDate = entries.filter(
                    (e): e is JournalEntry & { createdAt: string } =>
                        typeof e.urgeIntensity === "number" &&
                        typeof e.createdAt === "string"
                );

                // 1. Urge trend points
                const points: UrgeTrendPoint[] = withUrgeAndDate
                    .slice()
                    .reverse()
                    .map((e) => ({
                        label: new Date(e.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                        }),
                        urgeIntensity: e.urgeIntensity ?? 0,
                    }));
                setTrendData(points);

                // 2. Aggregate triggers from preUrgeTriggers arrays
                const triggerCounts = new Map<string, number>();

                (entries as JournalWithTriggers[]).forEach((entry) => {
                    const triggers = entry.preUrgeTriggers;
                    if (Array.isArray(triggers)) {
                        triggers.forEach((name) => {
                            const trimmed = name?.trim();
                            if (!trimmed) return;
                            triggerCounts.set(
                                trimmed,
                                (triggerCounts.get(trimmed) ?? 0) + 1
                            );
                        });
                    }
                });

                const aggregated: TriggerView[] = Array.from(triggerCounts.entries())
                    .map(([name, frequency]) => ({ name, frequency }))
                    .sort((a, b) => b.frequency - a.frequency);

                setTriggersAggregated(aggregated);
            } catch {
                // quietly fail; UI will show empty states
            } finally {
                setLoading(false);
            }
        };

        void fetchInsights();
    }, [isAuthenticated]);

    const topTriggers: TriggerView[] = useMemo(
        () => triggersAggregated.slice(0, 5),
        [triggersAggregated]
    );

    const maxFrequency = useMemo(
        () =>
            topTriggers.reduce(
                (max, t) => Math.max(max, t.frequency),
                0
            ),
        [topTriggers]
    );

    // --- Relapse-risk preview (front-end heuristic, not medical advice) ---
    const riskSummary: RiskSummary | null = useMemo(() => {
        if (trendData.length === 0 && topTriggers.length === 0) {
            return null;
        }

        const avgUrge =
            trendData.length > 0
                ? trendData.reduce((sum, p) => sum + p.urgeIntensity, 0) /
                  trendData.length
                : 0;

        const totalTriggerCount = topTriggers.reduce(
            (sum, t) => sum + t.frequency,
            0
        );

        const urgeComponent = Math.min(Math.max(avgUrge / 10, 0), 1);
        const triggerComponent = Math.min(totalTriggerCount / 20, 1);

        const score = Math.min(
            urgeComponent * 0.65 + triggerComponent * 0.35,
            1
        );

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

    // While redirecting, render nothing
    if (!isAuthenticated) {
        return null;
    }

    return (
        <PageWrapper>
            <Content>
                <Header>
                    <HeaderLeft>
                        <HeaderIcon
                            src={TriggersInsightsIcon}
                            alt="Triggers & Insights icon"
                        />
                        <HeaderTitleGroup>
                            <HeaderTitle>Insights</HeaderTitle>
                            <HeaderSubtitle>
                                Charts, trends and a gentle relapse-risk preview based on
                                your logs.
                            </HeaderSubtitle>
                        </HeaderTitleGroup>
                    </HeaderLeft>

                    <AvatarButton onClick={() => navigate("/profile")}>
                        <AvatarImage src={headerAvatar} alt={user?.email || "Profile"} />
                    </AvatarButton>
                </Header>

                {/* Urge trend card */}
                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Urge levels over time</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        A soft overview of how your urge intensity has been moving in your
                        recent journal entries.
                    </SectionSub>

                    {loading ? (
                        <EmptyState>Loading urge trend…</EmptyState>
                    ) : trendData.length < 2 ? (
                        <EmptyState>
                            Add a few more journal entries with urge ratings to see your
                            trend here.
                        </EmptyState>
                    ) : (
                        <TrendChartWrapper>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={trendData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: -10,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="2 2" stroke="#dde" />
                                    <XAxis dataKey="label" tickMargin={4} />
                                    <Tooltip
                                        formatter={(v: number) => [`${v}/10`, "Urge level"]}
                                        labelFormatter={(label: string) => label}
                                        contentStyle={{
                                            borderRadius: 8,
                                            fontSize: "0.75rem",
                                        }}
                                        labelStyle={{ fontSize: "0.75rem" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="urgeIntensity"
                                        stroke="#00b3c4"
                                        strokeWidth={2}
                                        dot={{ r: 2 }}
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </TrendChartWrapper>
                    )}
                </Card>

                {/* Relapse-risk preview card (front-end heuristic) */}
                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Relapse-risk preview</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        A simple visual based on your recent urge levels and how often
                        triggers show up. This is for awareness only and is not a
                        diagnosis or medical advice.
                    </SectionSub>

                    {!riskSummary ? (
                        <EmptyState>
                            Log a few more urges and triggers, and you’ll see a small
                            relapse-risk preview here.
                        </EmptyState>
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
                            <SectionSub style={{ marginTop: "0.5rem" }}>
                                {riskSummary.explanation}
                            </SectionSub>
                        </>
                    )}
                </Card>

                {/* Top triggers card */}
                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Top triggers</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        Based on your logs, these triggers show up the most. They can be
                        helpful focus points for coping plans and support.
                    </SectionSub>

                    {loading ? (
                        <EmptyState>Loading triggers…</EmptyState>
                    ) : topTriggers.length === 0 ? (
                        <EmptyState>
                            No trigger data yet. As you log moods and triggers in your
                            Journal, they’ll appear here.
                        </EmptyState>
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

                {/* Word cloud / quick visual */}
                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Trigger word cloud</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        Bigger, bolder words = triggers that show up more often in your
                        logs.
                    </SectionSub>

                    {topTriggers.length === 0 ? (
                        <EmptyState>
                            Once you have some trigger data, you’ll see a simple word
                            cloud here.
                        </EmptyState>
                    ) : (
                        <WordCloudWrapper>
                            {topTriggers.map((t) => {
                                const base = t.frequency;
                                const scale =
                                    maxFrequency > 0 ? base / maxFrequency : 0.5;
                                return (
                                    <Word
                                        key={t.name}
                                        $scale={0.3 + scale * 0.7}
                                    >
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
};

export default TriggersInsightsPage;
