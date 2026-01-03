// client/src/app/(protected)/home/page.tsx

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import type { PredictionResponse } from "@/types";
import { HeaderAvatar } from "@/components/common";


/**------------------------
    Risk level buckets.
---------------------------*/
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

/**---------------------------
    Me response interface.
------------------------------*/
export interface MeResponse {
    user?: {
        email: string;
        displayName?: string;
        avatarUrl?: string;
        coping_worked?: string[];
        coping_not_worked?: string[];
    };
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

    @media (max-width: 768px) {
        padding: 1rem 0.9rem 110px;
    }
`;

const Content = styled.div`
    width: 100%;
    max-width: 960px;
`;

const Header = styled.header`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
`;

// Keep logo sized via width/height (Next/Image requirement)
const Logo = styled(Image)`
    width: auto;
    height: 90px;
`;

const Section = styled.section`
    width: 100%;
    padding: ${({ theme }) => theme.spacing(5)};
    margin-bottom: ${({ theme }) => theme.spacing(4)};

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(3)};
    }
`;

const WelcomeText = styled.h2`
    font-size: 1.65rem;
    text-align: center;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
    color: ${({ theme }) => theme.colors.text_primary};
`;

const OverviewStatusRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
    flex-wrap: wrap;
    justify-content: center;
`;

const StatusPill = styled.span<{ $variant?: "ok" | "warning" }>`
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
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

const StatusText = styled.span`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    max-width: 520px;
    text-align: center;
`;

const SkeletonCircle = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
`;

const SkeletonBar = styled.div<{ $width?: string; $height?: string }>`
    width: ${({ $width }) => $width || "100%"};
    height: ${({ $height }) => $height || "16px"};
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
`;

const SkeletonCard = styled.div`
    width: 100%;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: ${({ theme }) => theme.spacing(4)};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
`;

const SkeletonSpacer = styled.div<{ $height?: string }>`
    height: ${({ $height }) => $height || "16px"};
`;

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
    width: 90%;
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
    const [riskCode, setRiskCode] = useState("1");
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
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (!overviewEnabled) return;
        const seen = sessionStorage.getItem("tm_welcome_seen");
        if (!seen) {
            setShowWelcome(true);
            sessionStorage.setItem("tm_welcome_seen", "1");
        }
    }, [overviewEnabled]);

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
                // NOTE: keep path consistent with your axiosClient baseURL setup.
                // If your axiosClient already prefixes /api, then "/auth/me" is fine.
                // If not, use "/api/auth/me".
                const meRes = await axiosClient.get<MeResponse>("/auth/me");
                if (cancelled) return;

                const u = meRes.data.user;
                if (!u) throw new Error("Missing user");

                setFromBackendRef.current(u.coping_worked, u.coping_not_worked);

                // Local fallback prediction
                try {
                    const stored = localStorage.getItem("tm_last_prediction");
                    if (stored) {
                        const parsed = JSON.parse(stored) as PredictionResponse;
                        setRiskScore(parsed.risk_score);
                        setConfidence(parsed.confidence);
                        setBucket((parsed.risk_bucket ?? "medium").toUpperCase() as RiskLevel);
                        if (parsed.risk_code) setRiskCode(parsed.risk_code);
                        if (parsed.model_version) setModelVersion(parsed.model_version);
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

    useEffect(() => {
        if (!overview?.relapseSummary) return;
        const rs = overview.relapseSummary;
        setRiskScore(rs.risk_score);
        setConfidence(rs.confidence);
        setBucket(rs.risk_bucket.toUpperCase() as RiskLevel);
        setModelVersion(rs.model_version ?? "live");
        setRiskCode("auto");
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
            <PageWrapper>
                <Content>
                    <Header>
                        <Logo src={AppLogo} alt="TrichMind Logo" width={260} height={90} priority />
                        <SkeletonCircle />
                    </Header>

                    <SkeletonCard>
                        <SkeletonBar $width="60%" $height="20px" />
                        <SkeletonSpacer $height="16px" />
                        <SkeletonBar $width="100%" $height="12px" />
                        <SkeletonSpacer $height="10px" />
                        <SkeletonBar $width="90%" $height="12px" />
                    </SkeletonCard>

                    <SkeletonCard>
                        <SkeletonBar $width="50%" $height="16px" />
                        <SkeletonSpacer $height="14px" />
                        <SkeletonBar $width="100%" $height="10px" />
                        <SkeletonSpacer $height="8px" />
                        <SkeletonBar $width="96%" $height="10px" />
                    </SkeletonCard>
                </Content>
            </PageWrapper>
        );
    }

    if (!isAuthenticated) return null;

    const predictionData: PredictionResponse = {
        risk_score: riskScore,
        risk_bucket: bucket.toLowerCase() as "low" | "medium" | "high",
        confidence,
        model_version: modelVersion ?? "live",
        risk_code: riskCode,
    };

    const historyFromOverview = overview?.riskHistory ?? [];

    return (
        <>
            <PageWrapper>
                <Content>
                    <Header>
                        <Link href="/home" aria-label="Go to home">
                            <Logo src={AppLogo} alt="TrichMind Logo" width={260} height={90} priority />
                        </Link>

                        <HeaderAvatar onClick={() => router.push("/profile")} />
                    </Header>

                    <Section>
                        <WelcomeText>
                            Welcome back, {user?.displayName || user?.email || "Friend"} 👋
                        </WelcomeText>

                        <OverviewStatusRow>
                            <StatusPill $variant={overviewError ? "warning" : "ok"}>
                                {overviewError ? "Using saved data" : "Auto-updating"}
                            </StatusPill>
                            <StatusText>
                                {overviewError
                                    ? "We couldn’t refresh your automatic overview this time, so you’re seeing your last saved prediction."
                                    : formatOverviewUpdatedLabel(lastUpdated)}
                            </StatusText>
                        </OverviewStatusRow>

                        <RiskResultCard data={predictionData} quote={quote} compact={isMobile} />
                    </Section>

                    <Section>
                        <DailyProgressCardAuto />
                    </Section>

                    <Section>
                        <CopingStrategiesCard
                            worked={copingWorked}
                            notWorked={copingNotWorked}
                            onToggle={toggleStrategy}
                        />
                    </Section>

                    <Section>
                        <RiskTrendChart history={historyFromOverview} />
                    </Section>
                </Content>
            </PageWrapper>

            {showWelcome && (
                <WelcomeOverlay role="dialog" aria-modal="true" aria-label="Welcome back message">
                    <WelcomeCard>
                        <WelcomeTitle>
                            Welcome back, {user?.displayName || "TrichMind friend"} 💜
                        </WelcomeTitle>
                        <WelcomeBody>
                            Your dashboard has been refreshed with your latest relapse risk prediction and progress data. Take a slow
                            breath, notice how you feel, and move through the tools at your own pace.
                        </WelcomeBody>
                        <ThemeButton onClick={() => setShowWelcome(false)}>
                            Let&apos;s begin
                        </ThemeButton>
                    </WelcomeCard>
                </WelcomeOverlay>
            )}
        </>
    );
}
