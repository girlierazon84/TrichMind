// client/src/pages/HomePage.tsx

import {
    useEffect,
    useState,
    useMemo,
    useRef,
    type MouseEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { axiosClient } from "@/services";
import {
    RiskResultCard,
    DailyProgressCardAuto,
    CopingStrategiesCard,
    RiskTrendChart,
    ThemeButton,
} from "@/components";
import { useAuth } from "@/hooks";
import { AppLogo } from "@/assets/images";
import { UserIcon } from "@/assets/icons";
import type { PredictionResponse } from "@/types/ml";

/**----------
    Types
-------------*/
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface MeResponse {
    user?: {
        // 🔸 Core fields
        email: string;
        displayName?: string;
        avatarUrl?: string;
        date_of_birth?: string;

        // 🔸 Raw fields from registration
        age?: number;
        age_of_onset?: number;
        years_since_onset?: number;
        pulling_severity?: number;
        pulling_frequency?: string;
        pulling_awareness?: string;
        successfully_stopped?: string;
        how_long_stopped_days?: number;
        emotion?: string;

        // 🔹 Optional encoded / derived fields
        pulling_frequency_encoded?: number;
        awareness_level_encoded?: number;
        how_long_stopped_days_est?: number;
        successfully_stopped_encoded?: number;
        emotion_intensity_sum?: number;
    };
}

/**---------------
    Animations
------------------*/
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

// User Menu / Avatar Styles
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

// Skeleton + Welcome modal styled components
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

// Helper to compute age if backend doesn't send `age`
const getAgeFromDob = (dateStr?: string): number | undefined => {
    if (!dateStr) return undefined;
    const dob = new Date(dateStr);
    if (Number.isNaN(dob.getTime())) return undefined;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age -= 1;
    }
    return age;
};

/**--------------
    Component
-----------------*/
export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const [riskScore, setRiskScore] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [riskCode, setRiskCode] = useState<string>("1");
    const [modelVersion, setModelVersion] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarShouldPulse, setAvatarShouldPulse] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

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

    // Load dashboard (user + ML prediction)
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const loadDashboard = async () => {
            setLoading(true);
            try {
                // 1) Fetch user
                const me = await axiosClient.get<MeResponse>("/api/auth/me");
                const u = me.data.user;
                if (!u) throw new Error("Missing user");

                // Avatar
                if (u.avatarUrl) {
                    setAvatarUrl((prev) => {
                        if (prev !== u.avatarUrl) {
                            setAvatarShouldPulse(true);
                            setTimeout(() => setAvatarShouldPulse(false), 1300);
                        }
                        return u.avatarUrl as string;
                    });
                } else {
                    setAvatarUrl(null);
                }

                // 2) Build friendly ML payload from raw user fields
                const age =
                    u.age !== undefined && u.age !== null
                        ? u.age
                        : getAgeFromDob(u.date_of_birth);

                const payload = {
                    age,
                    age_of_onset: u.age_of_onset,
                    years_since_onset: u.years_since_onset,
                    pulling_severity: u.pulling_severity,
                    pulling_frequency: u.pulling_frequency,
                    pulling_awareness: u.pulling_awareness,
                    successfully_stopped: u.successfully_stopped,
                    how_long_stopped_days: u.how_long_stopped_days,
                    emotion: u.emotion,
                };

                const missing = Object.entries(payload)
                    .filter(([, v]) => v === undefined || v === null || v === "")
                    .map(([k]) => k);

                if (missing.length) {
                    console.warn(
                        "Skipping ML prediction, missing fields:",
                        missing.join(", ")
                    );
                } else {
                    const pred = await axiosClient.post<PredictionResponse>(
                        "/api/ml/predict_friendly",
                        payload
                    );

                    const data = pred.data;

                    setRiskScore(data.risk_score);
                    setConfidence(data.confidence);
                    setBucket(
                        String(data.risk_bucket || "medium").toUpperCase() as RiskLevel
                    );

                    if (data.risk_code !== undefined && data.risk_code !== null) {
                        setRiskCode(String(data.risk_code));
                    }

                    if (data.model_version) {
                        setModelVersion(data.model_version);
                    }
                }
            } catch (err) {
                console.error("Dashboard load / ML prediction failed:", err);
                // On hard failure, force re-login
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        void loadDashboard();
    }, [isAuthenticated, navigate]);

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

    const riskBucketLower = bucket.toLowerCase() as "low" | "medium" | "high";
    const predictionData = {
        risk_score: riskScore,
        risk_bucket: riskBucketLower,
        confidence,
        model_version: modelVersion ?? "live",
        // RiskResultCard expects risk_code as string
        risk_code: riskCode,
    };

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
