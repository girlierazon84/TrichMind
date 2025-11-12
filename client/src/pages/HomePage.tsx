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

// ──────────────────────────────
// Types
// ──────────────────────────────
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

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

// ──────────────────────────────
// Styled Layout
// ──────────────────────────────
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

// ──────────────────────────────
// Component
// ──────────────────────────────
export default function HomePage() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [riskScore, setRiskScore] = useState<number>(0);
    const [confidence, setConfidence] = useState<number>(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [loading, setLoading] = useState<boolean>(true);
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

    // 📱 Responsive layout listener
    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        const handleResize = (e: MediaQueryListEvent | MediaQueryList) =>
            setIsMobile(e.matches);

        handleResize(mediaQuery);
        mediaQuery.addEventListener("change", handleResize);
        return () => mediaQuery.removeEventListener("change", handleResize);
    }, []);

    // 🧩 Load user & predict risk
    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate("/login");
            return;
        }

        (async () => {
            try {
                const { data } = await axiosClient.get("/auth/me");
                const featurePayload: FeaturePayload = {
                    pulling_severity: data.pulling_severity ?? 5,
                    pulling_frequency_encoded: data.pulling_frequency_encoded ?? 3,
                    awareness_level_encoded: data.awareness_level_encoded ?? 0.5,
                    how_long_stopped_days_est: data.how_long_stopped_days_est ?? 14,
                    successfully_stopped_encoded: data.successfully_stopped_encoded ?? 0,
                    years_since_onset: data.years_since_onset ?? 8,
                    age: data.age ?? 30,
                    age_of_onset: data.age_of_onset ?? 18,
                    emotion_intensity_sum: data.emotion_intensity_sum ?? 4.5,
                };

                const res = await axiosClient.post("/ml/predict", featurePayload);
                const { risk_score, risk_bucket, confidence } = res.data;

                setRiskScore(risk_score ?? 0);
                setBucket(((risk_bucket || "MEDIUM") as string).toUpperCase() as RiskLevel);
                setConfidence(confidence ?? 0);
            } catch (error) {
                console.error("⚠️ Failed to load user or prediction:", error);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        })();
    }, [isAuthenticated, navigate, user]);

    // 💬 Motivational message
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

    // 🩺 Conditional Rendering
    if (!isAuthenticated) {
        navigate("/login");
        return null;
    }
    if (loading) return <p>Loading your personalized home page...</p>;
    if (!user) return <p>Unable to load user profile.</p>;

    // ✅ PredictResponse structure
    const predictionData = {
        risk_score: riskScore,
        risk_bucket: bucket.toLowerCase(),
        risk_code: bucket === "HIGH" ? 2 : bucket === "MEDIUM" ? 1 : 0,
        confidence,
        model_version: "v1.0.0",
    };

    return (
        <PageWrapper>
            {/* 🧭 Header */}
            <Header>
                <Link to="/" aria-label="Home" className="logo-link">
                    <img src="/assets/images/app_logo.png" alt="TrichMind" />
                </Link>

                <details className="user-menu-wrap">
                    <summary className="user-button" aria-label="Account menu">
                        <img src="/assets/icons/user.png" alt="Account" className="user_icon" />
                    </summary>
                    <nav className="user-menu">
                        <Link to="/profile" className="menu-item">
                            Profile
                        </Link>
                        <button
                            type="button"
                            className="menu-item"
                            onClick={() => {
                                localStorage.removeItem("auth_token");
                                localStorage.removeItem("user");
                                navigate("/login");
                            }}
                        >
                            Logout
                        </button>
                    </nav>
                </details>
            </Header>

            {/* 🎯 Welcome */}
            <Section>
                <WelcomeText>
                    Welcome back, {user.displayName || user.email || "Friend"} 👋
                </WelcomeText>

                {/* 🧠 Risk Summary */}
                <RiskResultCard data={predictionData} quote={quote} compact={isMobile} />
            </Section>

            {/* 🔁 Daily Progress */}
            <Section>
                <DailyProgressCardAuto />
            </Section>

            {/* 💪 Coping Strategies */}
            <Section>
                <CopingStrategiesCard
                    worked={["Fidget toy", "Deep breathing"]}
                    notWorked={["Journaling"]}
                />
            </Section>

            {/* 📊 Risk Trend */}
            <DashboardSection>
                <h2>📈 Relapse Risk Analytics</h2>
                <RiskTrendChart />
            </DashboardSection>
        </PageWrapper>
    );
}
