// client/src/pages/HomePage.tsx

import {
    useEffect,
    useState,
    useMemo,
    useCallback,
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

export interface PredictResponse {
    risk_score: number;
    risk_bucket: RiskLevel | string;
    confidence: number;
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

/* -----------------------------------------------------
    Styled Components
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

const UserMenuWrapper = styled.div`
    position: relative;
`;

const UserButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;

    img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.75);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    &:hover img {
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
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: ${({ theme }) => theme.spacing(5)};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
    box-shadow: ${({ theme }) => theme.colors.card_shadow};

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
    Component
----------------------------------------------------- */
export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const [riskScore, setRiskScore] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    /* Dropdown Menu */
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

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

    /* Responsive listener */
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    /* Load prediction + avatar */
    const loadPrediction = useCallback(async () => {
        try {
            const res = await axiosClient.get<MeResponse>("/api/auth/me");
            const u = res.data.user;
            if (!u) throw new Error("Missing user");

            if (u.avatarUrl) {
                setAvatarUrl(u.avatarUrl);
            }

            const pred = await axiosClient.post<PredictResponse>("/api/ml/predict", {
                pulling_severity: u.pulling_severity ?? 5,
                pulling_frequency_encoded: u.pulling_frequency_encoded ?? 3,
                awareness_level_encoded: u.awareness_level_encoded ?? 0.5,
                how_long_stopped_days_est: u.how_long_stopped_days_est ?? 14,
                successfully_stopped_encoded: u.successfully_stopped_encoded ?? 0,
                years_since_onset: u.years_since_onset ?? 8,
                age: u.age ?? 30,
                age_of_onset: u.age_of_onset ?? 18,
                emotion_intensity_sum: u.emotion_intensity_sum ?? 4.5,
            });

            setRiskScore(pred.data.risk_score);
            setConfidence(pred.data.confidence);
            setBucket(String(pred.data.risk_bucket).toUpperCase() as RiskLevel);
        } catch {
            navigate("/login");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (isAuthenticated) loadPrediction();
    }, [isAuthenticated, loadPrediction]);

    /* Quote */
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

    if (loading)
        return (
            <PageWrapper>
                <p>Loading your personalized dashboard…</p>
            </PageWrapper>
        );

    const predictionData = {
        risk_score: riskScore,
        risk_bucket: bucket.toLowerCase(),
        risk_code: bucket === "HIGH" ? 2 : bucket === "MEDIUM" ? 1 : 0,
        confidence,
        model_version: "v1.0.0",
    };

    const headerAvatar = avatarUrl || UserIcon;

    return (
        <>
            <PageWrapper>
                <Header>
                    <Link to="/">
                        <img
                            src={AppLogo}
                            className="app_logo"
                            alt="TrichMind Logo"
                        />
                    </Link>

                    <UserMenuWrapper ref={menuRef}>
                        <UserButton onClick={toggleMenu}>
                            <img src={headerAvatar} alt="User avatar" />
                        </UserButton>

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
                    <h2>📈 Relapse Risk Analytics</h2>
                    <RiskTrendChart />
                </DashboardSection>
            </PageWrapper>
        </>
    );
};

export default HomePage;
