// client/src/app/(protected)/trichgame/page.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { css, keyframes } from "styled-components";
import { useAuth, useTrichGame } from "@/hooks";
import { TrichGameIcon } from "@/assets/icons";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    Tooltip,
    CartesianGrid
} from "recharts";
import { HeaderAvatar } from "@/components/common";


/**------------------------------------
    Challenge modes and state types
---------------------------------------*/
type ChallengeMode = "focus_tap" | "picky_pad" | "grounding" | "breathing";

interface FocusTapState {
    taps: number;
    target: number;
}

interface HairDot {
    id: number;
    plucked: boolean;
}

interface SessionPoint {
    label: string;
    score: number;
}

const wiggle = keyframes`
    0% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
    100% { transform: translateY(0); }
`;

const pop = keyframes`
    0% { transform: scale(1); }
    40% { transform: scale(1.2); }
    100% { transform: scale(1); }
`;

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
    margin-bottom: 1.4rem;
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
    line-height: 0;

    .p-one,
    .p-two {
        display: block;
    }
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

const SmallLabel = styled.span`
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const PickyMessage = styled.p`
    margin-top: 0.4rem;
    font-size: 0.72rem;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    background: linear-gradient(90deg, #ffe4f1, #e3f7ff);
    color: #304c63;
`;

const StatusRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    align-items: center;
    margin-bottom: 0.6rem;
`;

const StatusItem = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 0.75rem;
`;

const StatusValue = styled.span`
    font-weight: 700;
    font-size: 0.85rem;
`;

const UrgeSliderWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

const UrgeSlider = styled.input`
    flex: 1;
`;

const ChallengeList = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
`;

const ChallengeChip = styled.button<{ $active: boolean }>`
    border-radius: 999px;
    padding: 0.45rem 0.7rem;
    font-size: 0.75rem;
    border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.primary : "rgba(0,0,0,0.12)")};
    background: ${({ $active }) => ($active ? "rgba(0, 179, 196, 0.15)" : "rgba(255,255,255,0.95)")};
    color: ${({ theme }) => theme.colors.text_primary};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const ProgressTrack = styled.div`
    width: 100%;
    height: 12px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
    overflow: hidden;
    margin-top: 0.5rem;
`;

const ProgressFill = styled.div<{ $pct: number }>`
    width: ${({ $pct }) => `${Math.min(100, $pct)}%`};
    height: 100%;
    background: linear-gradient(90deg, #45e0c2, #00b3c4);
    transition: width 0.15s ease-out;
`;

const GameButtonRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.7rem;
`;

const PrimaryButton = styled.button`
    flex: 1;
    min-width: 120px;
    border-radius: 999px;
    border: none;
    padding: 0.55rem 0.7rem;
    background: ${({ theme }) => theme.colors.primary};
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
`;

const SecondaryButton = styled.button`
    flex: 1;
    min-width: 120px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    padding: 0.55rem 0.7rem;
    background: rgba(255, 255, 255, 0.96);
    color: ${({ theme }) => theme.colors.text_primary};
    font-size: 0.78rem;
    cursor: pointer;
`;

const PickyPadGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-top: 0.6rem;
`;

const PickyDot = styled.button<{ $plucked: boolean }>`
    width: 52px;
    height: 52px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    background: ${({ $plucked }) =>
        $plucked
            ? "radial-gradient(circle at 30% 30%, #ffffff, #a3e8ff)"
            : "radial-gradient(circle at 30% 30%, #ffdfef, #ff7aa2)"};
    box-shadow: ${({ $plucked }) =>
        $plucked ? "inset 0 0 6px rgba(0,0,0,0.18)" : "0 4px 10px rgba(0,0,0,0.2)"};
    position: relative;
    overflow: hidden;
    animation: ${({ $plucked }) =>
        $plucked ? css`${pop} 160ms ease-out` : css`${wiggle} 1500ms ease-in-out infinite`};

    &::before {
        content: "";
        position: absolute;
        top: 6px;
        left: 50%;
        transform: translateX(-50%);
        width: 16px;
        height: 26px;
        border-radius: 10px 10px 0 0;
        border: 2px solid rgba(139, 87, 42, 0.72);
        border-bottom: none;
        background: linear-gradient(180deg, rgba(139, 87, 42, 0.3), transparent);
        opacity: ${({ $plucked }) => ($plucked ? 0 : 1)};
        transition: opacity 0.18s ease-out;
    }
`;

const ChartWrapper = styled.div`
    margin-top: 0.5rem;
    height: 160px;

    .recharts-cartesian-axis-tick-value {
        font-size: 0.6rem;
    }
`;

const EmptyState = styled.p`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    margin: 0.2rem 0 0.6rem;
`;

const HAIR_DOT_COUNT = 12;

export default function TrichGamePage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { startSession, completeSession, fetchSessions, sessions, loading: gameLoading } = useTrichGame();

    const [mode, setMode] = useState<ChallengeMode>("focus_tap");
    const [currentUrge, setCurrentUrge] = useState<number>(3);
    const [points, setPoints] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);

    const [focusTap, setFocusTap] = useState<FocusTapState>({ taps: 0, target: 30 });

    const [hairDots, setHairDots] = useState<HairDot[]>(() =>
        Array.from({ length: HAIR_DOT_COUNT }, (_, i) => ({ id: i, plucked: false }))
    );

    const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
    const [pickyClears, setPickyClears] = useState<number>(0);
    const [pickyMessage, setPickyMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) router.replace("/login?next=/trichgame");
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;
        void fetchSessions({ page: 1, limit: 15, sort: "-createdAt" });
    }, [isAuthenticated, fetchSessions]);

    const resetLocalGameState = () => {
        setFocusTap({ taps: 0, target: 30 });
        setHairDots(Array.from({ length: HAIR_DOT_COUNT }, (_, i) => ({ id: i, plucked: false })));
        setPickyMessage(null);
        setActiveSessionId(undefined);
        setPoints(0);
    };

    const ensureSession = async (): Promise<string> => {
        if (activeSessionId) return activeSessionId;

        const created = await startSession({
            gameName: "TrichGame",
            mode,
            score: 0,
            streak,
            durationSeconds: 0,
            completed: false,
            metadata: { challengeMode: mode, initialUrge: currentUrge },
        });

        const id = created._id!;
        setActiveSessionId(id);
        return id;
    };

    const handleTap = async () => {
        if (!isAuthenticated || gameLoading) return;
        await ensureSession();

        setFocusTap((prev) => ({ ...prev, taps: prev.taps + 1 }));
        setPoints((p) => p + 1);
    };

    const handleToggleDot = async (dotId: number) => {
        if (!isAuthenticated || gameLoading) return;
        await ensureSession();

        setHairDots((prev) => {
            const next = prev.map((d) => (d.id === dotId ? { ...d, plucked: !d.plucked } : d));
            const pluckedNow = next.filter((d) => d.plucked).length;

            if (pluckedNow === HAIR_DOT_COUNT) {
                setPickyClears((c) => c + 1);
                setPickyMessage("Pad cleared! Your hands just did a full safe picky round 🏆");
            } else {
                const msgs = [
                    "Nice pop! Safe picky instead of hair 💖",
                    "Another dot gone — keep going 🎯",
                    "That urge can wait, these dots can’t 😄",
                    "Perfect, that’s a safe target for your fingers.",
                ];
                setPickyMessage(msgs[Math.floor(Math.random() * msgs.length)]);
            }

            return next;
        });

        setPoints((p) => p + 1);
    };

    const finishSession = async (didResist: boolean) => {
        if (!isAuthenticated || gameLoading) return;

        const id = await ensureSession();

        const taps = focusTap.taps;
        const pluckedCount = hairDots.filter((d) => d.plucked).length;
        const score = taps + pluckedCount;

        const newStreak = didResist ? streak + 1 : 0;
        const finalUrge = Math.max(0, didResist ? currentUrge - 2 : currentUrge + 1);

        await completeSession(id, {
            score,
            streak: newStreak,
            durationSeconds: Math.max(1, score),
            completed: true,
            endedAt: new Date().toISOString(),
            metadata: {
                challengeMode: mode,
                initialUrge: currentUrge,
                finalUrge,
                taps,
                safePadDots: pluckedCount,
                gaveIn: !didResist,
                padClears: pickyClears,
            },
        });

        setStreak(newStreak);
        setCurrentUrge(finalUrge);
        resetLocalGameState();
    };

    const handleExportLog = () => {
        if (!sessions || sessions.length === 0) return;

        const payload = JSON.stringify(sessions, null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "trichgame_sessions.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const sessionChartData: SessionPoint[] = useMemo(
        () => (sessions ?? []).slice().reverse().map((s, idx) => ({ label: `S${idx + 1}`, score: s.score ?? 0 })),
        [sessions]
    );

    const focusProgressPct = (focusTap.taps / focusTap.target) * 100 || 0;
    const pluckedCount = hairDots.filter((d) => d.plucked).length;

    if (!isAuthenticated) return null;

    return (
        <PageWrapper>
            <Content>
                <Header>
                    <HeaderLeft>
                        <HeaderIcon src={TrichGameIcon.src} alt="TrichGame icon" />
                        <HeaderTitleGroup>
                            <HeaderTitle>TrichGame — Beat the Urge</HeaderTitle>
                            <HeaderSubtitle>
                                <p className="p-one">Short, safe micro-challenges that keep your hands busy &</p>
                                <p className="p-two">gently lower your urge meter.</p>
                            </HeaderSubtitle>
                        </HeaderTitleGroup>
                    </HeaderLeft>

                    <HeaderAvatar onClick={() => router.push("/profile")} />
                </Header>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Urge &amp; focus</SectionTitle>
                    </SectionTitleRow>

                    <StatusRow>
                        <StatusItem>
                            <SmallLabel>Urge</SmallLabel>
                            <StatusValue>{currentUrge} / 10</StatusValue>
                        </StatusItem>
                        <StatusItem>
                            <SmallLabel>Points</SmallLabel>
                            <StatusValue>{points}</StatusValue>
                        </StatusItem>
                        <StatusItem>
                            <SmallLabel>Streak</SmallLabel>
                            <StatusValue>{streak}</StatusValue>
                        </StatusItem>
                    </StatusRow>

                    <UrgeSliderWrapper>
                        <SmallLabel>Keep it under 3 to feel safer</SmallLabel>
                        <UrgeSlider
                            type="range"
                            min={0}
                            max={10}
                            value={currentUrge}
                            onChange={(e) => setCurrentUrge(Number(e.target.value))}
                        />
                    </UrgeSliderWrapper>
                </Card>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Choose a micro-challenge</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        Pick a quick task that looks doable right now. Each success is a small win and gently redirects the urge.
                    </SectionSub>

                    <ChallengeList>
                        <ChallengeChip type="button" $active={mode === "focus_tap"} onClick={() => setMode("focus_tap")}>
                            Focus Tap
                        </ChallengeChip>
                        <ChallengeChip type="button" $active={mode === "picky_pad"} onClick={() => setMode("picky_pad")}>
                            Safe Picky Pad
                        </ChallengeChip>
                        <ChallengeChip type="button" $active={mode === "grounding"} onClick={() => setMode("grounding")}>
                            5-4-3-2-1 Grounding
                        </ChallengeChip>
                        <ChallengeChip type="button" $active={mode === "breathing"} onClick={() => setMode("breathing")}>
                            Guided Breathing
                        </ChallengeChip>
                    </ChallengeList>
                </Card>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>
                            {mode === "focus_tap" && "Focus Tap — tap quickly"}
                            {mode === "picky_pad" && "Safe Picky Pad (hair-pull sim)"}
                            {mode === "grounding" && "Grounding (5-4-3-2-1)"}
                            {mode === "breathing" && "Soft breathing focus"}
                        </SectionTitle>
                    </SectionTitleRow>

                    {mode === "focus_tap" && (
                        <>
                            <SectionSub>
                                Tap the button quickly to fill the bar. Imagine each tap sending a tiny “no thanks” to the urge.
                            </SectionSub>
                            <SmallLabel>
                                Taps: {focusTap.taps} / {focusTap.target}
                            </SmallLabel>
                            <ProgressTrack>
                                <ProgressFill $pct={focusProgressPct} />
                            </ProgressTrack>
                            <GameButtonRow>
                                <PrimaryButton type="button" onClick={handleTap}>
                                    Tap now
                                </PrimaryButton>
                                <SecondaryButton type="button" onClick={resetLocalGameState}>
                                    Reset challenge
                                </SecondaryButton>
                            </GameButtonRow>
                        </>
                    )}

                    {mode === "picky_pad" && (
                        <>
                            <SectionSub>
                                Gently “pluck” the little pads instead of hair. Feel the pop, watch the tuft vanish, and let your hands
                                get that picky satisfaction in a safe way.
                            </SectionSub>
                            <SmallLabel>
                                Plucked dots: {pluckedCount} / {HAIR_DOT_COUNT} · Full pads cleared: {pickyClears}
                            </SmallLabel>

                            <PickyPadGrid>
                                {hairDots.map((dot) => (
                                    <PickyDot
                                        key={dot.id}
                                        type="button"
                                        $plucked={dot.plucked}
                                        onClick={() => void handleToggleDot(dot.id)}
                                    />
                                ))}
                            </PickyPadGrid>

                            {pickyMessage && <PickyMessage>{pickyMessage}</PickyMessage>}

                            <GameButtonRow>
                                <SecondaryButton type="button" onClick={resetLocalGameState}>
                                    Clear pad
                                </SecondaryButton>
                            </GameButtonRow>
                        </>
                    )}

                    {mode === "grounding" && (
                        <SectionSub>
                            Look around and quietly notice: 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell,
                            1 you can taste. You can log this as a game even without tapping anything.
                        </SectionSub>
                    )}

                    {mode === "breathing" && (
                        <SectionSub>
                            Try a gentle pattern: inhale for 4, hold for 4, exhale for 6. Repeat a few times while watching your urge
                            number if you’d like.
                        </SectionSub>
                    )}

                    <GameButtonRow style={{ marginTop: "0.9rem" }}>
                        <SecondaryButton type="button" onClick={() => void finishSession(false)} disabled={gameLoading}>
                            I gave in (log)
                        </SecondaryButton>
                        <PrimaryButton type="button" onClick={() => void finishSession(true)} disabled={gameLoading}>
                            End challenge &amp; log
                        </PrimaryButton>
                    </GameButtonRow>

                    {gameLoading && (
                        <SmallLabel style={{ display: "block", marginTop: "0.4rem" }}>Saving session…</SmallLabel>
                    )}
                </Card>

                <Card>
                    <SectionTitleRow>
                        <SectionTitle>Session Log &amp; Insights</SectionTitle>
                    </SectionTitleRow>
                    <SectionSub>
                        Each game adds a dot. Higher scores = more taps / safe pad plucks. You can export this to share with a
                        therapist or keep for yourself.
                    </SectionSub>

                    {sessionChartData.length === 0 ? (
                        <EmptyState>Play a few rounds of TrichGame and your session chart will appear here.</EmptyState>
                    ) : (
                        <ChartWrapper>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sessionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="2 2" stroke="#dde" />
                                    <XAxis dataKey="label" tickMargin={4} />
                                    <Tooltip
                                        formatter={(v: number | undefined) => [`${v ?? 0}`, "Score"]}
                                        labelFormatter={(label: string) => label}
                                        contentStyle={{ borderRadius: 8, fontSize: "0.75rem" }}
                                        labelStyle={{ fontSize: "0.75rem" }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#00b3c4" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartWrapper>
                    )}

                    <GameButtonRow style={{ marginTop: "0.8rem" }}>
                        <SecondaryButton type="button" onClick={handleExportLog} disabled={!sessions || sessions.length === 0}>
                            Export session log (JSON)
                        </SecondaryButton>
                    </GameButtonRow>
                </Card>
            </Content>
        </PageWrapper>
    );
}
