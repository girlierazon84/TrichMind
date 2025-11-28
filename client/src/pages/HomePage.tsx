// client/src/pages/HomePage.tsx

import {
    useEffect,
    useState,
    useMemo,
    useRef,
    type MouseEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { axiosClient } from "@/services";
import {
    RiskResultCard,
    DailyProgressCardAuto,
    CopingStrategiesCard,
    RiskTrendChart,
    ThemeButton,
} from "@/components";
import {
    useAuth,
    useCopingStrategies,
    useRelapseOverview,
} from "@/hooks";
import { AppLogo } from "@/assets/images";
import { UserIcon } from "@/assets/icons";
import type { PredictionResponse } from "@/types/ml";

/**----------
    Types
-------------*/
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

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

/**-------------------------------
    Styled Components – Layout
----------------------------------*/
const PageWrapper = styled.div`
    width: 100%;
    min-height: calc(100vh - 70px);
    padding: ${({ theme }) => theme.spacing(6)};
    padding-bottom: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(3)};
        padding-bottom: 110px;
    }
`;

const Header = styled.header`
    width: 100%;
    max-width: 960px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing(5)};

    .app_logo {
        height: 90px;
    }
`;

const UserMenuWrapper = styled.div`
    position: relative;
`;

const AvatarButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
`;

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

const DropdownMenu = styled.div<{ open: boolean }>`
    position: absolute;
    top: 48px;
    right: 0;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 14px;
    padding: 0.5rem 0;
    min-width: 170px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.15);

    opacity: ${({ open }) => (open ? 1 : 0)};
    transform: translateY(${({ open }) => (open ? "0" : "-6px")});
    pointer-events: ${({ open }) => (open ? "auto" : "none")};

    transition: opacity 0.25s ease, transform 0.25s ease;
    z-index: 5000;
`;

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

const Section = styled.section`
    width: 100%;
    max-width: 960px;
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

// ✅ overview status row
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

const StatusPill = styled.span<{ $variant?: "ok" | "warning" }>`
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    background: ${({ $variant }) =>
        $variant === "warning"
            ? "rgba(255, 173, 120, 0.18)"
            : "rgba(120, 255, 190, 0.18)"};
    color: ${({ theme, $variant }) =>
        $variant === "warning"
            ? theme.colors.medium_risk_gradient || "#ff9a3c"
            : theme.colors.low_risk_gradient || "#26c485"};
    border: 1px solid
        ${({ $variant }) =>
            $variant === "warning"
                ? "rgba(255, 173, 120, 0.6)"
                : "rgba(120, 255, 190, 0.6)"};
`;

const StatusText = styled.span`
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    max-width: 520px;
    text-align: center;

    @media (max-width: 768px) {
        text-align: left;
    }
`;

// Skeletons
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
    max-width: 960px;
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

// ✅ overview error hint (optional, controlled via flag below)
const OverviewErrorText = styled.p`
    margin-top: 0.75rem;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

/**----------------
 * Helpers
 *-----------------*/
function formatOverviewUpdatedLabel(lastUpdated: Date | null): string {
    if (!lastUpdated) return "Getting your latest overview…";

    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMs < 60_000) {
        return "Last updated just now.";
    }
    if (diffMinutes < 60) {
        return `Last updated ${diffMinutes} min ago.`;
    }

    const sameDay = now.toDateString() === lastUpdated.toDateString();
    const timeStr = lastUpdated.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (sameDay) {
        return `Last updated today at ${timeStr}.`;
    }

    const dateStr = lastUpdated.toLocaleDateString();
    return `Updated on ${dateStr} at ${timeStr}.`;
}

/**--------------
    Component
-----------------*/
export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const {
        worked: copingWorked,
        notWorked: copingNotWorked,
        setFromBackend,
        toggleStrategy,
    } = useCopingStrategies();

    // overview hook
    const {
        data: overview,
        loading: overviewLoading,
        error: overviewError,
        lastUpdated,
    } = useRelapseOverview();

    const [riskScore, setRiskScore] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [riskCode, setRiskCode] = useState<string>("1");
    const [modelVersion, setModelVersion] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // 👇 toggle this if you ever want an extra hint below the card
    const SHOW_OVERVIEW_ERROR_HINT = false;

    const toggleMenu = (e: MouseEvent) => {
        e.stopPropagation();
        setMenuOpen((prev) => !prev);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };

        window.addEventListener("click", handler as unknown as EventListener);
        return () =>
            window.removeEventListener("click", handler as unknown as EventListener);
    }, []);

    // Mobile layout detection
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);

        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // One-time welcome modal per session
    useEffect(() => {
        if (!isAuthenticated) return;
        const seen = sessionStorage.getItem("tm_welcome_seen");
        if (!seen) {
            setShowWelcome(true);
            sessionStorage.setItem("tm_welcome_seen", "1");
        }
    }, [isAuthenticated]);

    // Load user info + fallback last prediction (localStorage)
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const loadDashboard = async () => {
            setLoading(true);
            try {
                const meRes = await axiosClient.get<MeResponse>("/api/auth/me");
                if (cancelled) return;

                const u = meRes.data.user;
                console.log("[Dashboard] /api/auth/me →", u);

                if (!u) throw new Error("Missing user");

                setAvatarUrl(u.avatarUrl ?? null);

                // Coping strategies → hook
                setFromBackend(u.coping_worked, u.coping_not_worked);

                // Fallback: last prediction from localStorage
                try {
                    const stored = localStorage.getItem("tm_last_prediction");
                    if (stored) {
                        const parsed = JSON.parse(stored) as PredictionResponse;
                        console.log("[Dashboard] Using stored prediction →", parsed);

                        setRiskScore(parsed.risk_score);
                        setConfidence(parsed.confidence);

                        const band = (parsed.risk_bucket ?? "medium").toUpperCase() as RiskLevel;
                        setBucket(band);

                        if (parsed.risk_code) setRiskCode(parsed.risk_code);
                        if (parsed.model_version) setModelVersion(parsed.model_version);
                    } else {
                        console.warn(
                            "[Dashboard] No stored prediction found (tm_last_prediction); using defaults"
                        );
                    }
                } catch (storageErr) {
                    console.error(
                        "[Dashboard] Failed to read stored prediction:",
                        storageErr
                    );
                }
            } catch (userErr) {
                if (!cancelled) {
                    console.error("[Dashboard] Failed to load user:", userErr);
                    navigate("/login");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadDashboard();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, navigate, setFromBackend]);

    // If overview endpoint returns a relapseSummary, prefer that over localStorage
    useEffect(() => {
        if (!overview || !overview.relapseSummary) return;
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

    if (!isAuthenticated) return null;

    if (loading || overviewLoading) {
        return (
            <PageWrapper>
                <Header>
                    <img src={AppLogo} className="app_logo" alt="TrichMind Logo" />
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
            </PageWrapper>
        );
    }

    const riskBucketLower = bucket.toLowerCase() as "low" | "medium" | "high";
    const predictionData: PredictionResponse = {
        risk_score: riskScore,
        risk_bucket: riskBucketLower,
        confidence,
        model_version: modelVersion ?? "live",
        risk_code: riskCode,
    };

    const headerAvatar = avatarUrl || UserIcon;

    console.log("[Dashboard] Final predictionData →", predictionData);
    console.log("[Dashboard] Coping strategies in HomePage →", {
        copingWorked,
        copingNotWorked,
    });

    const historyFromOverview = overview?.riskHistory ?? [];

    return (
        <>
            <PageWrapper>
                <Header>
                    <Link to="/">
                        <img src={AppLogo} className="app_logo" alt="TrichMind Logo" />
                    </Link>

                    <UserMenuWrapper ref={menuRef}>
                        <AvatarButton onClick={toggleMenu}>
                            <AvatarImage src={headerAvatar} alt="User avatar" />
                        </AvatarButton>

                        <DropdownMenu open={menuOpen}>
                            <MenuItem onClick={() => navigate("/profile")}>
                                Profile
                            </MenuItem>

                            <MenuItem
                                onClick={() => {
                                    logout();
                                    navigate("/login");
                                }}
                            >
                                Logout
                            </MenuItem>
                        </DropdownMenu>
                    </UserMenuWrapper>
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

                    <RiskResultCard
                        data={predictionData}
                        quote={quote}
                        compact={isMobile}
                    />

                    {overviewError && SHOW_OVERVIEW_ERROR_HINT && (
                        <OverviewErrorText>
                            We&apos;re showing your most recent saved prediction. Your
                            automatic overview will update again as soon as the connection
                            is stable.
                        </OverviewErrorText>
                    )}
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
            </PageWrapper>

            {showWelcome && (
                <WelcomeOverlay>
                    <WelcomeCard>
                        <WelcomeTitle>
                            Welcome back, {user?.displayName || "TrichMind friend"} 💜
                        </WelcomeTitle>
                        <WelcomeBody>
                            Your dashboard has been refreshed with your latest relapse risk
                            prediction and progress data. Take a slow breath, notice how you
                            feel, and move through the tools at your own pace.
                        </WelcomeBody>
                        <ThemeButton onClick={() => setShowWelcome(false)}>
                            Let&apos;s begin
                        </ThemeButton>
                    </WelcomeCard>
                </WelcomeOverlay>
            )}
        </>
    );
};

export default HomePage;
