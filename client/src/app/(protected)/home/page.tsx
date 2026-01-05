// client/src/app/(protected)/home/page.tsx

"use client";

import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { axiosClient } from "@/services";
import {
    RiskResultCard,
    DailyProgressCardAuto,
    CopingStrategiesCard,
    RiskTrendChart,
    ThemeButton,
} from "@/components";
import { useAuth, useCopingStrategies, useRelapseOverview } from "@/hooks";
import { AppLogo } from "@/assets/images";
import type { PredictionResponse, RiskBucket } from "@/types/ml";
import { HeaderAvatar } from "@/components/common";


/**----------
    Types
-------------*/
// Uppercase risk level type
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

// Response type for /auth/me API
export interface MeResponse {
    user?: {
        email: string;
        displayName?: string;
        avatarUrl?: string;
        coping_worked?: string[];
        coping_not_worked?: string[];
    };
}

/**-------------------------
    Mobile-first styling
----------------------------*/
const Page = styled.main`
    width: 100%;
    min-height: 100dvh;
    padding: 14px 12px 110px;
    background: linear-gradient(
        180deg,
        #e7f7f8 0%,
        ${({ theme }) => theme.colors.page_bg || "#f4fbfc"} 280px
    );

    /* safe-area friendly bottom padding */
    padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px));

    @media (min-width: 768px) {
        padding: 18px 18px 90px;
        padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px));
    }
`;

const Container = styled.div`
    width: 100%;
    max-width: 980px;
    margin: 0 auto;
`;

const TopBar = styled.header`
    position: sticky;
    top: 0;
    z-index: 50;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    padding: 10px 4px 12px;
    backdrop-filter: blur(10px);
    background: rgba(244, 251, 252, 0.65);

    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    @media (min-width: 768px) {
        position: static;
        background: transparent;
        border-bottom: none;
        padding: 6px 0 16px;
    }
`;

const LogoWrap = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const Logo = styled(Image)`
    width: auto;
    height: 56px;

    @media (min-width: 768px) {
        height: 74px;
    }
`;

const TitleStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const Hello = styled.h1`
    margin: 0;
    font-size: 1.05rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.text_primary};

    @media (min-width: 768px) {
        font-size: 1.2rem;
    }
`;

const Meta = styled.p`
    margin: 0;
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    line-height: 1.3;
`;

const StatusRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin: 10px 0 14px;
`;

const StatusPill = styled.span<{ $variant?: "ok" | "warning" }>`
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;

    background: ${({ $variant }) =>
            $variant === "warning" ? "rgba(255, 173, 120, 0.18)" : "rgba(120, 255, 190, 0.18)"};

    color: ${({ theme, $variant }) =>
            $variant === "warning"
                ? theme.colors.medium_risk_gradient || "#ff9a3c"
                : theme.colors.low_risk_gradient || "#26c485"};

    border: 1px solid
            ${({ $variant }) =>
                $variant === "warning" ? "rgba(255, 173, 120, 0.6)" : "rgba(120, 255, 190, 0.6)"};
`;

const Card = styled.section`
    width: 100%;
    padding: 14px;

    @media (min-width: 768px) {
        padding: 16px;
    }
`;

const Stack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;

    @media (min-width: 900px) {
        gap: 16px;
    }
`;

const TwoCol = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;

    @media (min-width: 920px) {
        grid-template-columns: 1.2fr 0.8fr;
        align-items: start;
    }
`;

/**------------------------
    Skeleton UI
---------------------------*/
const SkeletonCircle = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
`;

const SkeletonBar = styled.div<{ $width?: string; $height?: string }>`
    width: ${({ $width }) => $width || "100%"};
    height: ${({ $height }) => $height || "14px"};
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
`;

const SkeletonSpacer = styled.div<{ $height?: string }>`
    height: ${({ $height }) => $height || "10px"};
`;

/**------------------
    Welcome modal
---------------------*/
const WelcomeOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(9, 20, 45, 0.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5500;
`;

const WelcomeCard = styled.div`
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 22px;
    padding: 1.9rem 1.8rem 1.6rem;
    max-width: 420px;
    width: 92%;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
    text-align: center;
`;

const WelcomeTitle = styled.h2`
    font-size: 1.35rem;
    margin: 0 0 0.75rem;
    color: ${({ theme }) => theme.colors.primary};
`;

const WelcomeBody = styled.p`
    font-size: 0.98rem;
    margin: 0 0 1.5rem;
    color: ${({ theme }) => theme.colors.text_primary};
    line-height: 1.5;
`;

/**------------------------
    Helpers
---------------------------*/
function formatOverviewUpdatedLabel(lastUpdated: Date | null): string {
    if (!lastUpdated) return "Getting your latest overview…";
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMs < 60_000) return "Last updated just now.";
    if (diffMinutes < 60) return `Last updated ${diffMinutes} min ago.`;

    const sameDay = now.toDateString() === lastUpdated.toDateString();
    const timeStr = lastUpdated.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

    if (sameDay) return `Last updated today at ${timeStr}.`;
    const dateStr = lastUpdated.toLocaleDateString();
    return `Updated on ${dateStr} at ${timeStr}.`;
}

function toFiniteNumber(v: unknown, fallback = 0): number {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : Number.NaN;
    return Number.isFinite(n) ? n : fallback;
}

function normalizeUpperBucket(v: unknown): RiskLevel {
    const s = String(v ?? "MEDIUM").toUpperCase();
    return s === "LOW" || s === "MEDIUM" || s === "HIGH" ? (s as RiskLevel) : "MEDIUM";
}

function toRiskBucket(level: RiskLevel): RiskBucket {
    switch (level) {
        case "LOW":
            return "low";
        case "HIGH":
            return "high";
        default:
            return "medium";
    }
}

function safeLocalStorageSet(key: string, value: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // ignore
    }
}

export default function HomePage() {
    const router = useRouter();
    const { user, token, isAuthenticated } = useAuth();

    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);

    const { worked: copingWorked, notWorked: copingNotWorked, setFromBackend, toggleStrategy } =
        useCopingStrategies();

    const overviewEnabled = hydrated && isAuthenticated;
    const { data: overview, loading: overviewLoading, error: overviewError, lastUpdated } =
        useRelapseOverview(overviewEnabled);

    const [riskScore, setRiskScore] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [riskCode, setRiskCode] = useState("auto");
    const [modelVersion, setModelVersion] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);

    const [isMobile, setIsMobile] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    const setFromBackendRef = useRef(setFromBackend);
    useEffect(() => {
        setFromBackendRef.current = setFromBackend;
    }, [setFromBackend]);

    const didLoadRef = useRef(false);
    useEffect(() => {
        didLoadRef.current = false;
    }, [token]);

    useEffect(() => {
        if (!hydrated) return;
        if (token) return;
        if (!isAuthenticated) router.replace("/login?next=/home");
    }, [hydrated, token, isAuthenticated, router]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (!overviewEnabled) return;
        if (typeof window === "undefined") return;
        const seen = sessionStorage.getItem("tm_welcome_seen");
        if (!seen) {
            setShowWelcome(true);
            sessionStorage.setItem("tm_welcome_seen", "1");
        }
    }, [overviewEnabled]);

    // Load /auth/me + local fallback prediction
    useEffect(() => {
        if (!hydrated) return;

        if (token && !isAuthenticated) {
            setLoading(true);
            return;
        }
        if (!token && !isAuthenticated) {
            setLoading(false);
            return;
        }
        if (!isAuthenticated) return;

        if (didLoadRef.current) return;
        didLoadRef.current = true;

        let cancelled = false;

        const loadDashboard = async () => {
            setLoading(true);
            try {
                const meRes = await axiosClient.get<MeResponse>("/auth/me");
                if (cancelled) return;

                const u = meRes.data.user;
                if (!u) throw new Error("Missing user");

                setFromBackendRef.current(u.coping_worked, u.coping_not_worked);

                // Local fallback prediction
                try {
                    const stored = localStorage.getItem("tm_last_prediction");
                    if (stored) {
                        const parsedUnknown: unknown = JSON.parse(stored);

                        if (parsedUnknown && typeof parsedUnknown === "object") {
                            const p = parsedUnknown as Partial<PredictionResponse>;

                            const score = toFiniteNumber(p.risk_score, 0);
                            const conf = toFiniteNumber(p.confidence, 0);

                            const rb: RiskBucket =
                                p.risk_bucket === "low" || p.risk_bucket === "medium" || p.risk_bucket === "high"
                                    ? p.risk_bucket
                                    : "medium";

                            setRiskScore(score);
                            setConfidence(conf);
                            setBucket(normalizeUpperBucket(rb));

                            if (typeof p.risk_code === "string") setRiskCode(p.risk_code);
                            if (typeof p.model_version === "string") setModelVersion(p.model_version);
                        }
                    }
                } catch {
                    // ignore
                }
            } catch {
                if (!cancelled) router.replace("/login?next=/home");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadDashboard();
        return () => {
            cancelled = true;
        };
    }, [hydrated, token, isAuthenticated, router]);

    // Apply fresh overview result
    useEffect(() => {
        if (!overview?.relapseSummary) return;

        const rs = overview.relapseSummary;

        const score = toFiniteNumber((rs as unknown as { risk_score?: unknown }).risk_score, 0);
        const conf = toFiniteNumber((rs as unknown as { confidence?: unknown }).confidence, 0);

        const rbRaw = (rs as unknown as { risk_bucket?: unknown }).risk_bucket;
        const rbStr = String(rbRaw ?? "medium").toLowerCase();
        const rb: RiskBucket =
            rbStr === "low" || rbStr === "medium" || rbStr === "high" ? (rbStr as RiskBucket) : "medium";

        const b = normalizeUpperBucket(rb);

        const mv =
            typeof (rs as unknown as { model_version?: unknown }).model_version === "string"
                ? ((rs as unknown as { model_version?: string }).model_version ?? "live")
                : "live";

        const looksPlaceholder = b === "MEDIUM" && score === 0 && conf === 0;
        if (looksPlaceholder) return;

        setRiskScore(score);
        setConfidence(conf);
        setBucket(b);
        setModelVersion(mv);
        setRiskCode("auto");

        safeLocalStorageSet(
            "tm_last_prediction",
            JSON.stringify({
                risk_score: score,
                confidence: conf,
                risk_bucket: rb,
                model_version: mv,
                risk_code: "auto",
            } satisfies PredictionResponse)
        );
    }, [overview]);

    const quote = useMemo(() => {
        switch (bucket) {
            case "LOW":
                return "You're doing great — stay mindful and steady.";
            case "MEDIUM":
                return "Notice your triggers early — small wins matter.";
            default:
                return "This is a moment to pause, breathe, and refocus — you've got this.";
        }
    }, [bucket]);

    const shouldShowSkeleton =
        !hydrated || loading || overviewLoading || (hydrated && !!token && !isAuthenticated);

    if (shouldShowSkeleton) {
        return (
            <Page>
                <Container>
                    <TopBar>
                        <LogoWrap>
                            <Logo src={AppLogo} alt="TrichMind Logo" width={220} height={74} priority />
                            <TitleStack>
                                <Hello>Loading…</Hello>
                                <Meta>Preparing your dashboard</Meta>
                            </TitleStack>
                        </LogoWrap>
                        <SkeletonCircle />
                    </TopBar>

                    <Stack>
                        <Card>
                            <SkeletonBar $width="56%" $height="18px" />
                            <SkeletonSpacer $height="12px" />
                            <SkeletonBar $width="100%" $height="12px" />
                            <SkeletonSpacer $height="10px" />
                            <SkeletonBar $width="92%" $height="12px" />
                        </Card>

                        <Card>
                            <SkeletonBar $width="48%" $height="16px" />
                            <SkeletonSpacer $height="12px" />
                            <SkeletonBar $width="100%" $height="12px" />
                            <SkeletonSpacer $height="10px" />
                            <SkeletonBar $width="94%" $height="12px" />
                        </Card>
                    </Stack>
                </Container>
            </Page>
        );
    }

    if (!isAuthenticated) return null;

    const predictionData: PredictionResponse = {
        risk_score: riskScore,
        risk_bucket: toRiskBucket(bucket),
        confidence,
        model_version: modelVersion ?? "live",
        risk_code: riskCode,
    };

    const historyFromOverview = overview?.riskHistory ?? [];

    return (
        <>
            <Page>
                <Container>
                    <TopBar>
                        <LogoWrap>
                            <Link href="/home" aria-label="Go to home">
                                <Logo src={AppLogo} alt="TrichMind Logo" width={220} height={74} priority />
                            </Link>

                            <TitleStack>
                                <Hello>Welcome back, {user?.displayName || user?.email || "Friend"} 👋</Hello>
                                <Meta>Take it slow — check in and use the tools at your pace.</Meta>
                            </TitleStack>
                        </LogoWrap>

                        <HeaderAvatar onClick={() => router.push("/profile")} />
                    </TopBar>

                    <StatusRow>
                        <StatusPill $variant={overviewError ? "warning" : "ok"}>
                            {overviewError ? "Using saved data" : "Auto-updating"}
                        </StatusPill>
                        <Meta>
                            {overviewError
                                ? "We couldn’t refresh right now — you’re seeing your last saved prediction."
                                : formatOverviewUpdatedLabel(lastUpdated)}
                        </Meta>
                    </StatusRow>

                    <Stack>
                        {/* Top dashboard row: Risk + Trend (stacks on mobile) */}
                        <TwoCol>
                            <Card>
                                <RiskResultCard data={predictionData} quote={quote} compact={isMobile} />
                            </Card>

                            <RiskTrendChart history={historyFromOverview} />
                        </TwoCol>

                        <Card>
                            <DailyProgressCardAuto />
                        </Card>

                        <Card>
                            <CopingStrategiesCard
                                worked={copingWorked}
                                notWorked={copingNotWorked}
                                onToggle={toggleStrategy}
                            />
                        </Card>
                    </Stack>
                </Container>
            </Page>

            {showWelcome && (
                <WelcomeOverlay role="dialog" aria-modal="true" aria-label="Welcome back message">
                    <WelcomeCard>
                        <WelcomeTitle>Welcome back, {user?.displayName || "TrichMind friend"} 💜</WelcomeTitle>
                        <WelcomeBody>
                            Your dashboard has been refreshed with your latest prediction and progress data. Take a slow breath,
                            notice how you feel, and move through the tools at your own pace.
                        </WelcomeBody>
                        <ThemeButton onClick={() => setShowWelcome(false)}>Let&apos;s begin</ThemeButton>
                    </WelcomeCard>
                </WelcomeOverlay>
            )}
        </>
    );
}
