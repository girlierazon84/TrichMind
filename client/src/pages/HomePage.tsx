// client/src/pages/HomePage.tsx

import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { axiosClient } from "@/services";
import {
    RiskResultCard,
    DailyProgressCardAuto,
    CopingStrategiesCard,
    RiskTrendChart,
} from "@/components";
import { useAuth } from "@/hooks";


/* ----------------------------------------------
 * Strict typing
 * ---------------------------------------------- */
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface MeResponse {
    ok?: boolean;
    user?: {
        _id?: string;
        id?: string;
        email: string;
        displayName?: string;

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

interface PredictResponse {
    risk_score: number;
    risk_bucket: RiskLevel | string;
    confidence: number;
}

interface FeaturePayload {
    pulling_severity: number;
    pulling_frequency_encoded: number;
    awareness_level_encoded: number;
    how_long_stopped_days_est: number;
    successfully_stopped_encoded: number;
    years_since_onset: number;
    age: number;
    age_of_onset: number;
    emotion_intensity_sum: number;
}

/* ----------------------------------------------
 * Styled Components
 * ---------------------------------------------- */
const PageWrapper = styled.div`
    width: 100%;
    min-height: 100vh;
    background: ${({ theme }) => theme.colors.page_bg};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${({ theme }) => theme.spacing(6)};
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(3)};
    }
`;

const Header = styled.header`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing(6)};

    .logo-link img {
        height: 50px;
    }

    .user-menu-wrap summary {
        list-style: none;
        cursor: pointer;
    }

    .user_icon {
        width: 36px;
        height: 36px;
    }

    .user-menu {
        position: absolute;
        right: 1rem;
        top: 3rem;
        background: ${({ theme }) => theme.colors.card_bg};
        border-radius: ${({ theme }) => theme.radius.md};
        box-shadow: ${({ theme }) => theme.colors.card_shadow};
        display: flex;
        flex-direction: column;
        min-width: 140px;

        .menu-item {
            padding: 0.75rem 1rem;
            text-align: left;
            color: ${({ theme }) => theme.colors.text_primary};
            text-decoration: none;
            font-size: 0.9rem;
            border: none;
            background: none;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .menu-item:hover {
            background: ${({ theme }) => theme.colors.sixthly};
        }
    }
`;

const Section = styled.section`
    width: 100%;
    max-width: 960px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: ${({ theme }) => theme.spacing(6)};
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    margin-bottom: ${({ theme }) => theme.spacing(6)};

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(4)};
    }
`;

const WelcomeText = styled.h2`
    font-size: 1.6rem;
    color: ${({ theme }) => theme.colors.text_primary};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
    text-align: center;

    @media (max-width: 768px) {
        font-size: 1.3rem;
    }
`;

const DashboardSection = styled.div`
    width: 100%;
    max-width: 960px;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
`;

/* ----------------------------------------------
 * Component
 * ---------------------------------------------- */
export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const [riskScore, setRiskScore] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [loading, setLoading] = useState(true);

    const [isMobile, setIsMobile] = useState<boolean>(
        typeof window !== "undefined" ? window.innerWidth <= 768 : false
    );

    /* ----------------------------------------------
     * Mobile detection (strict type)
     * ---------------------------------------------- */
    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");

        const handleResize = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches);
        };

        mediaQuery.addEventListener("change", handleResize);
        setIsMobile(mediaQuery.matches);

        return () => mediaQuery.removeEventListener("change", handleResize);
    }, []);

    /* ----------------------------------------------
     * Load user profile + prediction
     * ---------------------------------------------- */
    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate("/login");
            return;
        }

        const fetchData = async () => {
            try {
                // 1️⃣ Fetch user profile
                const res = await axiosClient.get<MeResponse>("/api/auth/me");
                const u = res.data.user;

                if (!u) throw new Error("User profile missing");

                // 2️⃣ Build ML payload
                const payload: FeaturePayload = {
                    pulling_severity: u.pulling_severity ?? 5,
                    pulling_frequency_encoded: u.pulling_frequency_encoded ?? 3,
                    awareness_level_encoded: u.awareness_level_encoded ?? 0.5,
                    how_long_stopped_days_est: u.how_long_stopped_days_est ?? 14,
                    successfully_stopped_encoded: u.successfully_stopped_encoded ?? 0,
                    years_since_onset: u.years_since_onset ?? 8,
                    age: u.age ?? 30,
                    age_of_onset: u.age_of_onset ?? 18,
                    emotion_intensity_sum: u.emotion_intensity_sum ?? 4.5,
                };

                // 3️⃣ Prediction request (MATCH BACKEND ROUTE)
                const prediction = await axiosClient.post<PredictResponse>(
                    "/api/ml/predict",
                    payload
                );

                const { risk_score, risk_bucket, confidence } = prediction.data;

                setRiskScore(risk_score ?? 0);
                setConfidence(confidence ?? 0);

                const level = String(risk_bucket || "MEDIUM").toUpperCase() as RiskLevel;
                setBucket(level);
            } catch (err) {
                console.error("⚠️ Failed to load homepage data:", err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [isAuthenticated, navigate, user]);

    /* ----------------------------------------------
     * Quote text
     * ---------------------------------------------- */
    const quote = useMemo(() => {
        switch (bucket) {
            case "LOW":
                return "You're doing great — stay mindful and steady.";
            case "MEDIUM":
                return "Notice your triggers early — small wins matter.";
            case "HIGH":
            default:
                return "This is a moment to pause, breathe, and refocus — you've got this.";
        }
    }, [bucket]);

    if (!isAuthenticated) {
        navigate("/login");
        return null;
    }

    if (loading) return <p>Loading your personalized home page...</p>;
    if (!user) return <p>Unable to load user profile.</p>;

    /* ----------------------------------------------
     * Final normalized prediction object
     * ---------------------------------------------- */
    const predictionData = {
        risk_score: riskScore,
        risk_bucket: bucket.toLowerCase(),
        risk_code: bucket === "HIGH" ? 2 : bucket === "MEDIUM" ? 1 : 0,
        confidence,
        model_version: "v1.0.0",
    };

    /* ----------------------------------------------
     * Render
     * ---------------------------------------------- */
    return (
        <PageWrapper>
            <Header>
                <Link to="/" aria-label="Home" className="logo-link">
                    <img src="/assets/images/app_logo.png" alt="TrichMind" />
                </Link>

                <details className="user-menu-wrap">
                    <summary aria-label="Account menu">
                        <img
                            src="/assets/icons/user.png"
                            alt="Account"
                            className="user_icon"
                        />
                    </summary>

                    <nav className="user-menu">
                        <Link to="/profile" className="menu-item">
                            Profile
                        </Link>

                        <button
                            type="button"
                            className="menu-item"
                            onClick={() => {
                                logout();
                                navigate("/login");
                            }}
                        >
                            Logout
                        </button>
                    </nav>
                </details>
            </Header>

            <Section>
                <WelcomeText>
                    Welcome back, {user.displayName || user.email || "Friend"} 👋
                </WelcomeText>

                <RiskResultCard
                    data={predictionData}
                    quote={quote}
                    compact={isMobile}
                />
            </Section>

            <Section>
                <DailyProgressCardAuto />
            </Section>

            <Section>
                <CopingStrategiesCard
                    worked={["Fidget toy", "Deep breathing"]}
                    notWorked={["Journaling"]}
                />
            </Section>

            <DashboardSection>
                <h2>📈 Relapse Risk Analytics</h2>
                <RiskTrendChart />
            </DashboardSection>
        </PageWrapper>
    );
};

export default HomePage;
