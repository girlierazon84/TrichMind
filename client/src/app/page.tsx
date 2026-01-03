// client/src/app/(protected)/home/page.tsx

"use client";

import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
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
import { UserIcon } from "@/assets/icons";
import type { PredictionResponse } from "@/types";


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
        date_of_birth?: string;

        age?: number;
        age_of_onset?: number;
        years_since_onset?: number;
        pulling_severity?: number;
        pulling_frequency?: string;
        pulling_awareness?: string;
        successfully_stopped?: string;
        how_long_stopped_days?: number;
        emotion?: string;

        pulling_frequency_encoded?: number;
        awareness_level_encoded?: number;
        how_long_stopped_days_est?: number;
        successfully_stopped_encoded?: boolean;
        emotion_intensity_sum?: number;

        coping_worked?: string[];
        coping_not_worked?: string[];
    };
}

/**-----------------------
    Styled components.
--------------------------*/
// Pagewrapper and layout styles
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

// Content container
const Content = styled.div`
    width: 100%;
    max-width: 960px;
`;

// Header styles
const Header = styled.header`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;

    .app_logo {
        height: 90px;
        width: auto;
    }
`;

// User menu styles
const UserMenuWrapper = styled.div`
    position: relative;
`;

// Avatar button styles
const AvatarButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
`;

// Avatar image styles
const AvatarImage = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.75);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    transition: transform 0.25s ease, box-shadow 0.25s ease;

    ${AvatarButton}:hover & {
        transform: scale(1.06);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
    }
`;

// Dropdown menu styles
const DropdownMenu = styled.div<{ $open: boolean }>`
    position: absolute;
    top: 48px;
    right: 0;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 14px;
    padding: 0.5rem 0;
    min-width: 170px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.15);

    opacity: ${({ $open }) => ($open ? 1 : 0)};
    transform: translateY(${({ $open }) => ($open ? "0" : "-6px")});
    pointer-events: ${({ $open }) => ($open ? "auto" : "none")};

    transition: opacity 0.25s ease, transform 0.25s ease;
    z-index: 5000;
`;

// Menu item styles
const MenuItem = styled.button`
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    padding: 0.85rem 1rem;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.text_primary};
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.sixthly};
    }
`;

// Section styles
const Section = styled.section`
    width: 100%;
    padding: ${({ theme }) => theme.spacing(5)};
    margin-bottom: ${({ theme }) => theme.spacing(4)};

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(3)};
    }
`;

// Welcome text styles
const WelcomeText = styled.h2`
    font-size: 1.65rem;
    text-align: center;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
    color: ${({ theme }) => theme.colors.text_primary};
`;

// Overview status row styles
const OverviewStatusRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
    flex-wrap: wrap;
    justify-content: center;

    @media (max-width: 768px) {
        align-items: flex-start;
    }
`;

// Status pill styles
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

// Status text styles
const StatusText = styled.span`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    max-width: 520px;
    text-align: center;

    @media (max-width: 768px) {
        text-align: left;
    }
`;

// Skeleton components for loading state
const SkeletonCircle = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
`;

// Skeleton bar styles
const SkeletonBar = styled.div<{ $width?: string; $height?: string }>`
    width: ${({ $width }) => $width || "100%"};
    height: ${({ $height }) => $height || "16px"};
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
`;

// Skeleton card styles
const SkeletonCard = styled.div`
    width: 100%;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: ${({ theme }) => theme.spacing(4)};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
`;

// Skeleton spacer styles
const SkeletonSpacer = styled.div<{ $height?: string }>`
    height: ${({ $height }) => $height || "16px"};
`;

// Welcome overlay styles
const WelcomeOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(9, 20, 45, 0.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5500;
`;

// Welcome card styles
const WelcomeCard = styled.div`
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 22px;
    padding: 1.9rem 1.8rem 1.6rem;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
    text-align: center;
`;

// Welcome title styles
const WelcomeTitle = styled.h2`
    font-size: 1.35rem;
    margin: 0 0 0.75rem;
    color: ${({ theme }) => theme.colors.primary};
`;

// Welcome body styles
const WelcomeBody = styled.p`
    font-size: 0.98rem;
    margin: 0 0 1.5rem;
    color: ${({ theme }) => theme.colors.text_primary};
    line-height: 1.5;
`;

/*-----------------------
    Helper functions.
-------------------------*/
function formatOverviewUpdatedLabel(lastUpdated: Date | null): string {
    // No timestamp
    if (!lastUpdated) return "Getting your latest overview…";

    // Calculate time difference
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    // Format based on time difference
    if (diffMs < 60_000) return "Last updated just now.";
    if (diffMinutes < 60) return `Last updated ${diffMinutes} min ago.`;

    // Check if same day
    const sameDay = now.toDateString() === lastUpdated.toDateString();
    const timeStr = lastUpdated.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });

    // Format for same day or earlier
    if (sameDay) return `Last updated today at ${timeStr}.`;

    // Different day
    const dateStr = lastUpdated.toLocaleDateString();
    return `Updated on ${dateStr} at ${timeStr}.`;
}

/**---------------------------------------------------------------------------------
    Convert next/image StaticImageData (and strings) to a plain <img> src string
------------------------------------------------------------------------------------*/
function toImgSrc(src: string | StaticImageData | null | undefined): string {
    // Handle null/undefined
    if (!src) return "";
    return typeof src === "string" ? src : src.src;
}

/**-------------------------
    Home page component.
----------------------------*/
export default function HomePage() {
    // Router and auth
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();

    // Coping strategies
    const { worked: copingWorked, notWorked: copingNotWorked, setFromBackend, toggleStrategy } =
        useCopingStrategies();

    // Relapse overview data
    const { data: overview, loading: overviewLoading, error: overviewError, lastUpdated } =
        useRelapseOverview();

    // Prediction state
    const [riskScore, setRiskScore] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [riskCode, setRiskCode] = useState("1");
    const [modelVersion, setModelVersion] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);

    // UI state
    const [isMobile, setIsMobile] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Close menu on outside click (DOM event)
    useEffect(() => {
        // Outside click handler
        const handler = (e: MouseEvent) => {
            // Ignore if clicking inside menu
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        // Attach event listener
        window.addEventListener("mousedown", handler);
        return () => window.removeEventListener("mousedown", handler);
    }, []);

    // Detect mobile view
    useEffect(() => {
        // Media query listener
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Show welcome overlay once per session
    useEffect(() => {
        // Only show if authenticated
        if (!isAuthenticated) return;
        const seen = sessionStorage.getItem("tm_welcome_seen");
        if (!seen) {
            // Show welcome
            setShowWelcome(true);
            sessionStorage.setItem("tm_welcome_seen", "1");
        }
    }, [isAuthenticated]);

    // Load user + last saved prediction
    useEffect(() => {
        // Redirect if not authenticated
        if (!isAuthenticated) {
            // Stop loading
            setLoading(false);
            router.replace("/login?next=/home");
            return;
        }

        // Cancellation flag
        let cancelled = false;

        // Load dashboard data
        const loadDashboard = async () => {
            // Start loading
            setLoading(true);
            try {
                // Fetch user info
                const meRes = await axiosClient.get<MeResponse>("/auth/me");
                if (cancelled) return;

                // Validate user data
                const u = meRes.data.user;
                if (!u) throw new Error("Missing user");

                // Set user data
                setAvatarUrl(u.avatarUrl ?? null);
                setFromBackend(u.coping_worked, u.coping_not_worked);

                // Load last prediction stored locally (fallback)
                try {
                    // Get from localStorage
                    const stored = localStorage.getItem("tm_last_prediction");
                    if (stored) {
                        // Parse and set prediction
                        const parsed = JSON.parse(stored) as PredictionResponse;
                        setRiskScore(parsed.risk_score);
                        setConfidence(parsed.confidence);

                        // Set risk bucket
                        const band = (parsed.risk_bucket ?? "medium").toUpperCase() as RiskLevel;
                        setBucket(band);

                        // Set other fields
                        if (parsed.risk_code) setRiskCode(parsed.risk_code);
                        if (parsed.model_version) setModelVersion(parsed.model_version);
                    }
                } catch {
                    // ignore
                }
            } catch {
                // Redirect to login on error
                if (!cancelled) router.replace("/login?next=/home");
            } finally {
                // Stop loading
                if (!cancelled) setLoading(false);
            }
        };

        // Invoke load
        void loadDashboard();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, router, setFromBackend]);

    // Update prediction from overview (live)
    useEffect(() => {
        // No overview data
        if (!overview?.relapseSummary) return;
        const rs = overview.relapseSummary;

        // Update prediction state
        setRiskScore(rs.risk_score);
        setConfidence(rs.confidence);
        setBucket(rs.risk_bucket.toUpperCase() as RiskLevel);
        setModelVersion(rs.model_version ?? "live");
        setRiskCode("auto");
    }, [overview]);

    // Motivational quote based on risk bucket
    const quote = useMemo(() => {
        // Select quote
        switch (bucket) {
            case "LOW":
                return "You're doing great — stay mindful and steady.";
            case "MEDIUM":
                return "Notice your triggers early — small wins matter.";
            default:
                return "This is a moment to pause, breathe, and refocus — you've got this.";
        }
    }, [bucket]);

    // Render null if not authenticated
    if (!isAuthenticated) return null;

    // Loading state
    if (loading || overviewLoading) {
        // Render skeletons
        return (
            <PageWrapper>
                <Content>
                    <Header>
                        <Image src={AppLogo} className="app_logo" alt="TrichMind Logo" priority />
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

    // Prepare prediction data for card
    const riskBucketLower = bucket.toLowerCase() as "low" | "medium" | "high";
    const predictionData: PredictionResponse = {
        risk_score: riskScore,
        risk_bucket: riskBucketLower,
        confidence,
        model_version: modelVersion ?? "live",
        risk_code: riskCode,
    };

    // ✅ Fix: ensure <img> gets a string (not StaticImageData)
    const headerAvatarSrc = toImgSrc(avatarUrl) || toImgSrc(UserIcon);

    // Extract history from overview
    const historyFromOverview = overview?.riskHistory ?? [];

    return (
        <>
            <PageWrapper>
                <Content>
                    <Header>
                        <Link href="/home" aria-label="Go to home">
                            <Image src={AppLogo} className="app_logo" alt="TrichMind Logo" priority />
                        </Link>

                        <UserMenuWrapper ref={menuRef}>
                            <AvatarButton
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    setMenuOpen((prev) => !prev);
                                }}
                                aria-label="Open user menu"
                                aria-expanded={menuOpen}
                                aria-controls="user-menu"
                            >
                                <AvatarImage src={headerAvatarSrc} alt={user?.email || "User avatar"} />
                            </AvatarButton>

                            <DropdownMenu id="user-menu" role="menu" aria-label="User menu" $open={menuOpen}>
                                <MenuItem role="menuitem" onClick={() => router.push("/profile")}>
                                    Profile
                                </MenuItem>
                                <MenuItem
                                    role="menuitem"
                                    onClick={() => {
                                        logout();
                                        router.replace("/login");
                                    }}
                                >
                                    Logout
                                </MenuItem>
                            </DropdownMenu>
                        </UserMenuWrapper>
                    </Header>

                    <Section>
                        <WelcomeText>Welcome back, {user?.displayName || user?.email || "Friend"} 👋</WelcomeText>

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
                        <CopingStrategiesCard worked={copingWorked} notWorked={copingNotWorked} onToggle={toggleStrategy} />
                    </Section>

                    <Section>
                        <RiskTrendChart history={historyFromOverview} />
                    </Section>
                </Content>
            </PageWrapper>

            {showWelcome && (
                <WelcomeOverlay role="dialog" aria-modal="true" aria-label="Welcome back message">
                    <WelcomeCard>
                        <WelcomeTitle>Welcome back, {user?.displayName || "TrichMind friend"} 💜</WelcomeTitle>
                        <WelcomeBody>
                            Your dashboard has been refreshed with your latest relapse risk prediction and progress data. Take a slow breath,
                            notice how you feel, and move through the tools at your own pace.
                        </WelcomeBody>
                        <ThemeButton onClick={() => setShowWelcome(false)}>Let&apos;s begin</ThemeButton>
                    </WelcomeCard>
                </WelcomeOverlay>
            )}
        </>
    );
}
