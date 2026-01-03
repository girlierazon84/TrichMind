// client/src/app/(protected)/health/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useHealth, useAuth } from "@/hooks";
import { ThemeButton } from "@/components";
import { HealthIcon } from "@/assets/icons";
import { notifyOverviewRefresh } from "@/utils";
import { HeaderAvatar } from "@/components/common";

/**---------------------------------------
    View model for a health log entry.
------------------------------------------*/
interface HealthLogView {
    _id: string;
    sleepHours: number;
    stressLevel: number;
    exerciseMinutes: number;
    date: string;
}

/**-----------------------
    Styled components.
--------------------------*/
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
    margin-bottom: 0.35rem;
`;

const SectionTitle = styled.h3`
    font-size: 0.9rem;
    margin: 0;
    color: ${({ theme }) => theme.colors.text_primary};
`;

const SectionSub = styled.p`
    margin: 0 0 0.45rem;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const SectionHint = styled.p`
    margin: 0 0 0.4rem;
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    opacity: 0.9;
`;

const SoftDivider = styled.hr`
    border: none;
    border-top: 1px dashed rgba(0, 0, 0, 0.06);
    margin: 0.6rem 0 0.5rem;
`;

const SliderLabelRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.25rem;

    span:first-child {
        font-size: 0.8rem;
        font-weight: 500;
    }
    span:last-child {
        font-size: 0.75rem;
        color: ${({ theme }) => theme.colors.text_secondary};
    }
`;

const RangeInput = styled.input.attrs({ type: "range" })`
    width: 100%;
    appearance: none;
    height: 10px;
    border-radius: 999px;
    background: #e0f2f4;
    outline: none;
    margin: 0.25rem 0 0.3rem;

    &::-webkit-slider-thumb {
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: ${({ theme }) => theme.colors.primary};
        cursor: pointer;
        box-shadow: 0 0 0 4px rgba(33, 178, 186, 0.2);
    }

    &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: ${({ theme }) => theme.colors.primary};
        cursor: pointer;
        box-shadow: 0 0 0 4px rgba(33, 178, 186, 0.2);
    }
`;

const TickRow = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    margin-top: 0.1rem;
`;

const SaveButton = styled(ThemeButton)`
    width: 100%;
    margin-top: 0.5rem;
`;

const LogsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

const LogItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.55rem 0.7rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
    font-size: 0.75rem;
`;

const LogDate = styled.span`
    white-space: nowrap;
    font-weight: 600;
`;

const LogMeta = styled.span`
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const EmptyState = styled.p`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    margin: 0.2rem 0 0.8rem;
`;

export default function HealthPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { create, list, loading } = useHealth();

    const [sleepHours, setSleepHours] = useState(7);
    const [stressLevel, setStressLevel] = useState(5);
    const [exerciseMinutes, setExerciseMinutes] = useState(30);

    const [saving, setSaving] = useState(false);
    const [logs, setLogs] = useState<HealthLogView[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const LS_KEY = "tm_health_logs";

    useEffect(() => {
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
            try {
                setLogs(JSON.parse(cached) as HealthLogView[]);
            } catch {
                // ignore
            }
        }
    }, []);

    const saveLogsToStorage = (items: HealthLogView[]) => {
        setLogs(items);
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(items));
        } catch {
            // ignore
        }
    };

    const fetchLogs = async () => {
        try {
            setLogsLoading(true);
            const res = await list();
            const items = (res?.logs ?? []) as HealthLogView[];
            saveLogsToStorage(items.slice(0, 5));
        } catch (e) {
            console.error("[HealthPage] Failed to load logs", e);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) router.replace("/login?next=/health");
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;
        void fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await create({ sleepHours, stressLevel, exerciseMinutes });

            const created = (res?.log ?? null) as HealthLogView | null;
            if (created && created._id) {
                const next = [created, ...logs].slice(0, 5);
                saveLogsToStorage(next);
            } else {
                await fetchLogs();
            }

            notifyOverviewRefresh("health");
        } catch {
            // handled by hook/toast
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });

    if (!isAuthenticated) return null;

    return (
        <PageWrapper>
            <Content>
                <Header>
                    <HeaderLeft>
                        <HeaderIcon src={HealthIcon.src} alt="Health icon" />
                        <HeaderTitleGroup>
                            <HeaderTitle>Health</HeaderTitle>
                            <HeaderSubtitle>Sleep, meds, body check-ins & symptom logs.</HeaderSubtitle>
                        </HeaderTitleGroup>
                    </HeaderLeft>

                    <HeaderAvatar onClick={() => router.push("/profile")} />
                </Header>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Daily health check-in</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>A quick snapshot of how your body is doing today.</SectionSub>
                    <SectionHint>No need for perfection — just a rough sense of sleep, stress and movement is already helpful.</SectionHint>

                    <SoftDivider />
                    <SectionTitleRow>
                        <SectionTitle>Sleep</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>How many hours did you sleep last night?</SectionSub>

                    <SliderLabelRow>
                        <span>Sleep hours</span>
                        <span>{sleepHours} h</span>
                    </SliderLabelRow>
                    <RangeInput min={0} max={12} step={1} value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} />
                    <TickRow>
                        <span>0</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span><span>12</span>
                    </TickRow>

                    <SoftDivider />
                    <SectionTitleRow>
                        <SectionTitle>Stress</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>How tense or calm have you felt today?</SectionSub>

                    <SliderLabelRow>
                        <span>Stress level</span>
                        <span>{stressLevel}/10</span>
                    </SliderLabelRow>
                    <RangeInput min={0} max={10} step={1} value={stressLevel} onChange={(e) => setStressLevel(Number(e.target.value))} />
                    <TickRow>
                        <span>0</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span>
                    </TickRow>

                    <SoftDivider />
                    <SectionTitleRow>
                        <SectionTitle>Movement</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>Any movement counts — walking, stretching, workouts, dancing.</SectionSub>

                    <SliderLabelRow>
                        <span>Exercise minutes</span>
                        <span>{exerciseMinutes} min</span>
                    </SliderLabelRow>
                    <RangeInput min={0} max={180} step={5} value={exerciseMinutes} onChange={(e) => setExerciseMinutes(Number(e.target.value))} />
                    <TickRow>
                        <span>0</span><span>30</span><span>60</span><span>90</span><span>120</span><span>150</span><span>180</span>
                    </TickRow>

                    <SaveButton onClick={handleSave} disabled={saving || loading}>
                        {saving ? "Saving..." : "Save health log"}
                    </SaveButton>
                </Card>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Recent health logs</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>These logs help personalize relapse-risk estimates and wellness insights on your Overview screen.</SectionSub>

                    {logsLoading ? (
                        <EmptyState>Loading recent logs…</EmptyState>
                    ) : logs.length === 0 ? (
                        <EmptyState>No logs yet. When you save a health check-in, it will appear here.</EmptyState>
                    ) : (
                        <LogsList>
                            {logs.map((log) => (
                                <LogItem key={log._id}>
                                    <LogDate>📅 {formatDate(log.date)}</LogDate>
                                    <LogMeta>
                                        • 😴 {log.sleepHours}h • 😰 Stress {log.stressLevel}/10 • 🏃‍♀️ {log.exerciseMinutes}min
                                    </LogMeta>
                                </LogItem>
                            ))}
                        </LogsList>
                    )}
                </Card>
            </Content>
        </PageWrapper>
    );
}
