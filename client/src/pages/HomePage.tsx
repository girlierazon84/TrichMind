// client/src/pages/HomePage.tsx

import {
    useEffect,
    useState,
    useMemo,
    useRef,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { axiosClient } from "@/services";
import {
    RiskResultCard,
    DailyProgressCardAuto,
    CopingStrategiesCard,
    RiskTrendChart,
    ThemeButton
} from "@/components";
import { useAuth } from "@/hooks";
import { AppLogo } from "@/assets/images";
import { UserIcon } from "@/assets/icons";


/* -----------------------------------------------------
    Types
----------------------------------------------------- */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface MeResponse {
    user?: {
        email: string;
        displayName?: string;
        avatarUrl?: string;

        pulling_severity?: number;
        pulling_frequency_encoded?: number;
        awareness_level_encoded?: number;
        how_long_stopped_days_est?: number;
        successfully_stopped_encoded?: number;
        years_since_onset?: number;
        age?: number;
        age_of_onset?: number;
        emotion_intensity_sum?: number;
    };
}

interface LastPredictionResponse {
    ok: boolean;
    prediction: {
        risk_score: number;
        risk_bucket: string;
        confidence: number;
        model_version?: string;
    };
}

/* -----------------------------------------------------
    Animations
----------------------------------------------------- */
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const smoothRise = keyframes`
    from { opacity: 0; transform: translateY(26px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const softPop = keyframes`
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
`;

const dropdownFade = keyframes`
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
    0%   { background-position: -220px 0; }
    100% { background-position: 220px 0; }
`;

const avatarPulse = keyframes`
    0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(91, 138, 255, 0.4); }
    60%  { transform: scale(1.06); box-shadow: 0 0 0 12px rgba(91, 138, 255, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(91, 138, 255, 0); }
`;

const modalFade = keyframes`
    from { opacity: 0; transform: translateY(18px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/* -----------------------------------------------------
    Styled Components – Layout
----------------------------------------------------- */
const PageWrapper = styled.div`
    width: 100%;
    min-height: calc(100vh - 70px);
    padding: ${({ theme }) => theme.spacing(6)};
    padding-bottom: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: ${fadeIn} 0.45s ease-out;

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
    animation: ${smoothRise} 0.5s ease-out;

    .app_logo {
        height: 90px;
    }
`;

/* -----------------------------------------------------
    User Menu / Avatar
----------------------------------------------------- */
const UserMenuWrapper = styled.div`
    position: relative;
`;

const AvatarButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
`;

const AvatarImage = styled.img<{ $pulse?: boolean }>`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.75);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    ${({ $pulse }) => ($pulse ? `animation: ${avatarPulse} 1.3s ease-out;` : "")};

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
    animation: ${dropdownFade} 0.25s ease-out;
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

/* -----------------------------------------------------
    Sections & Dashboard
----------------------------------------------------- */
const Section = styled.section<{ $delay?: number; $pop?: boolean }>`
    width: 100%;
    max-width: 960px;

    padding: ${({ theme }) => theme.spacing(5)};
    margin-bottom: ${({ theme }) => theme.spacing(4)};

    animation: ${({ $pop }) => ($pop ? softPop : smoothRise)} 0.6s ease-out;
    animation-delay: ${({ $delay }) => ($delay ? `${$delay}ms` : "0ms")};
    animation-fill-mode: both;

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(3)};
    }
`;

const DashboardSection = styled.div<{ $delay?: number }>`
    width: 100%;
    max-width: 960px;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
    animation: ${softPop} 0.65s ease-out;
    animation-delay: ${({ $delay }) => ($delay ? `${$delay}ms` : "0ms")};
    animation-fill-mode: both;
`;

const WelcomeText = styled.h2`
    font-size: 1.65rem;
    text-align: center;
    margin-bottom: ${({ theme }) => theme.spacing(4)};
    color: ${({ theme }) => theme.colors.text_primary};
`;

/* -----------------------------------------------------
    Skeleton Loader
----------------------------------------------------- */
const SkeletonCircle = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.15),
        rgba(255, 255, 255, 0.32),
        rgba(255, 255, 255, 0.15)
    );
    background-size: 220px 100%;
    animation: ${shimmer} 1.4s infinite linear;
`;

const SkeletonBar = styled.div<{ $width?: string; $height?: string }>`
    width: ${({ $width }) => $width || "100%"};
    height: ${({ $height }) => $height || "16px"};
    border-radius: 999px;
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.15),
        rgba(255, 255, 255, 0.32),
        rgba(255, 255, 255, 0.15)
    );
    background-size: 220px 100%;
    animation: ${shimmer} 1.4s infinite linear;
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

/* -----------------------------------------------------
    Welcome Modal
----------------------------------------------------- */
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
    animation: ${modalFade} 0.35s ease-out;
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

/* -----------------------------------------------------
    Component
----------------------------------------------------- */
export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    // Risk state
    const [riskScore, setRiskScore] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Avatar
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarShouldPulse, setAvatarShouldPulse] = useState(false);

    // Welcome Modal
    const [showWelcome, setShowWelcome] = useState(false);

    // Dropdown Menu
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Dropdown Menu Handlers
    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen((prev) => !prev);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };

        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, []);

    // Responsive listener
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);

        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Show welcome modal once per session
    useEffect(() => {
        if (!isAuthenticated) return;
        const seen = sessionStorage.getItem("tm_welcome_seen");
        if (!seen) {
            setShowWelcome(true);
            sessionStorage.setItem("tm_welcome_seen", "1");
        }
    }, [isAuthenticated]);

    // Load avatar + last prediction
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const loadDashboard = async () => {
            try {
                // 1) Fetch user for avatar
                const me = await axiosClient.get<MeResponse>("/api/auth/me");
                const u = me.data.user;
                if (!u) throw new Error("Missing user");

                if (u.avatarUrl) {
                    setAvatarUrl((prev) => {
                        if (prev !== u.avatarUrl) {
                            setAvatarShouldPulse(true);
                            setTimeout(() => setAvatarShouldPulse(false), 1300);
                        }
                        return u.avatarUrl as string;
                    });
                }

                // 2) Fetch last prediction from server
                const last = await axiosClient.get<LastPredictionResponse>("/api/ml/last");
                const p = last.data.prediction;

                setRiskScore(p.risk_score);
                setConfidence(p.confidence);
                setBucket(
                    String(p.risk_bucket || "MEDIUM").toUpperCase() as RiskLevel
                );
            } catch {
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        void loadDashboard();
    }, [isAuthenticated, navigate]);

    // Quote based on bucket
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

    // Redirect if not authenticated
    if (!isAuthenticated) return null;

    // Loading state
    if (loading) {
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

    // Prediction data object for RiskResultCard
    const riskBucketLower = bucket.toLowerCase() as "low" | "medium" | "high";
    const predictionData = {
        risk_score: riskScore,
        risk_bucket: riskBucketLower,
        risk_code: bucket === "HIGH" ? 2 : bucket === "MEDIUM" ? 1 : 0,
        confidence,
        model_version: "v1.0.0",
    };

    // Header avatar
    const headerAvatar = avatarUrl || UserIcon;

    return (
        <>
            <PageWrapper>
                <Header>
                    <Link to="/">
                        <img src={AppLogo} className="app_logo" alt="TrichMind Logo" />
                    </Link>

                    <UserMenuWrapper ref={menuRef}>
                        <AvatarButton onClick={toggleMenu}>
                            <AvatarImage
                                src={headerAvatar}
                                alt="User avatar"
                                $pulse={avatarShouldPulse}
                            />
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

                <Section $delay={120} $pop>
                    <WelcomeText>
                        Welcome back, {user?.displayName || user?.email || "Friend"} 👋
                    </WelcomeText>

                    <RiskResultCard
                        data={predictionData}
                        quote={quote}
                        compact={isMobile}
                    />
                </Section>

                <Section $delay={300}>
                    <DailyProgressCardAuto />
                </Section>

                <Section $delay={450}>
                    <CopingStrategiesCard />
                </Section>

                <DashboardSection $delay={650}>
                    <RiskTrendChart />
                </DashboardSection>
            </PageWrapper>

            {showWelcome && (
                <WelcomeOverlay>
                    <WelcomeCard>
                        <WelcomeTitle>
                            Welcome back, {user?.displayName || "TrichMind friend"} 💜
                        </WelcomeTitle>
                        <WelcomeBody>
                            Your dashboard has been refreshed with your latest relapse
                            risk prediction and progress data. Take a slow breath,
                            notice how you feel, and move through the tools at your own
                            pace.
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
