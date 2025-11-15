// client/src/pages/HomePage.tsx

import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { fadeIn, slideUp } from "@/styles/animations";
import { axiosClient } from "@/services";
import {
    RiskResultCard,
    DailyProgressCardAuto,
    CopingStrategiesCard,
    RiskTrendChart,
} from "@/components";
import { useAuth } from "@/hooks";
import { UserIcon } from "@/assets/icons";
import { AppLogo } from "@/assets/images";

/* ---------------------------------------------------------
    ADVANCED CALM-STYLE ANIMATIONS
--------------------------------------------------------- */

const scalePop = keyframes`
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
`;

const slideDownFade = keyframes`
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const riseMask = keyframes`
    from { opacity: 0; transform: translateY(20px); clip-path: inset(30% 0 0 0); }
    to   { opacity: 1; transform: translateY(0); clip-path: inset(0 0 0 0); }
`;

/* ---------------------------------------------------------
    Styled Components
--------------------------------------------------------- */

const PageWrapper = styled.div`
    width: 100%;
    min-height: 100vh;
    background: ${({ theme }) => theme.colors.page_bg};
    padding: ${({ theme }) => theme.spacing(6)};
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: ${fadeIn} 0.55s ease-out;

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(3)};
    }
`;

const Header = styled.header`
    width: 100%;
    max-width: 960px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing(6)};
    animation: ${slideDownFade} 0.55s ease-out;
`;

const Section = styled.section<{ delay?: number; pop?: boolean }>`
    width: 100%;
    max-width: 960px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: ${({ theme }) => theme.spacing(6)};
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    margin-bottom: ${({ theme }) => theme.spacing(5)};
    animation: ${({ pop }) => (pop ? scalePop : slideUp)} 0.6s ease-out;
    animation-delay: ${({ delay }) => delay ?? 0}ms;
    animation-fill-mode: both;

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(4)};
    }
`;

const WelcomeText = styled.h2`
    text-align: center;
    font-size: 1.7rem;
    color: ${({ theme }) => theme.colors.text_primary};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
    animation: ${fadeIn} 0.6s ease-out;

    @media (max-width: 768px) {
        font-size: 1.3rem;
    }
`;

const DashboardSection = styled.div<{ delay?: number }>`
    width: 100%;
    max-width: 960px;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(4)};
    animation: ${riseMask} 0.7s ease-out;
    animation-delay: ${({ delay }) => delay ?? 0}ms;
    animation-fill-mode: both;
`;

const ChartTitle = styled.h2`
    margin-bottom: 1rem;
    animation: ${fadeIn} 0.6s ease-out;
`;

/* ---------------------------------------------------------
    Strict typing
--------------------------------------------------------- */

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface MeResponse {
    user?: {
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

/* ---------------------------------------------------------
    Component
--------------------------------------------------------- */

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const [riskScore, setRiskScore] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= 768 : false
    );

    /* Mobile detector */
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);

        mq.addEventListener("change", update);
        update();
        return () => mq.removeEventListener("change", update);
    }, []);

    /* Load user + prediction */
    const loadPrediction = useCallback(async () => {
        if (!isAuthenticated || !user) {
            navigate("/login");
            return;
        }

        try {
            const me = await axiosClient.get<MeResponse>("/api/auth/me");
            const u = me.data.user;
            if (!u) throw new Error("User not found");

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

            const pred = await axiosClient.post<PredictResponse>("/api/ml/predict", payload);

            setRiskScore(pred.data.risk_score);
            setConfidence(pred.data.confidence);
            setBucket(String(pred.data.risk_bucket).toUpperCase() as RiskLevel);
        } catch {
            navigate("/login");
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        loadPrediction();
    }, [loadPrediction]);

    /* ✔ FIXED — Hooks must be BEFORE returns */
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

    /* Early redirects MUST be after hooks */
    if (!isAuthenticated) return null;
    if (loading)
        return (
            <PageWrapper>
                <p>Loading your personalized home page…</p>
            </PageWrapper>
        );

    const predictionData = {
        risk_score: riskScore,
        risk_bucket: bucket.toLowerCase(),
        risk_code: bucket === "HIGH" ? 2 : bucket === "MEDIUM" ? 1 : 0,
        confidence,
        model_version: "v1.0.0",
    };

    return (
        <PageWrapper>
            {/* HEADER */}
            <Header>
                <Link to="/" className="logo-link">
                    <img src={AppLogo} height={50} alt="TrichMind logo" />
                </Link>

                <details className="user-menu-wrap">
                    <summary>
                        <img src={UserIcon} height={36} alt="Account icon" />
                    </summary>
                    <nav className="user-menu">
                        <Link to="/profile" className="menu-item">Profile</Link>
                        <button onClick={() => { logout(); navigate("/login"); }}>
                            Logout
                        </button>
                    </nav>
                </details>
            </Header>

            {/* CARD 1 — Main Risk */}
            <Section delay={120} pop>
                <WelcomeText>
                    Welcome back, {user?.displayName || user?.email || "Friend"} 👋
                </WelcomeText>

                <RiskResultCard
                    data={predictionData}
                    quote={quote}
                    compact={isMobile}
                />
            </Section>

            {/* CARD 2 */}
            <Section delay={300}>
                <DailyProgressCardAuto />
            </Section>

            {/* CARD 3 */}
            <Section delay={450}>
                <CopingStrategiesCard />
            </Section>

            {/* CARD 4 */}
            <DashboardSection delay={600}>
                <ChartTitle>📈 Relapse Risk Analytics</ChartTitle>
                <RiskTrendChart />
            </DashboardSection>
        </PageWrapper>
    );
};

export default HomePage;
