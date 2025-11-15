// client/src/pages/HomePage.tsx

import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { axiosClient } from "@/services";
import {
    RiskResultCard,
    DailyProgressCardAuto,
    CopingStrategiesCard,
    RiskTrendChart
} from "@/components";
import { useAuth } from "@/hooks";
import { AppLogo } from "@/assets/images";
import { UserIcon } from "@/assets/icons";


/* -----------------------------------------------------
    Calm Premium Animations
----------------------------------------------------- */

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const smoothRise = keyframes`
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const softPop = keyframes`
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
`;

const maskedRise = keyframes`
    from { opacity: 0; clip-path: inset(40% 0 0 0); }
    to   { opacity: 1; clip-path: inset(0 0 0 0); }
`;

/* -----------------------------------------------------
    Styled Components
----------------------------------------------------- */

const PageWrapper = styled.div`
    width: 100%;
    min-height: 100vh;
    background: ${({ theme }) => theme.colors.page_bg};
    padding: ${({ theme }) => theme.spacing(6)};
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: ${fadeIn} 0.5s ease-out;

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
    margin-bottom: ${({ theme }) => theme.spacing(5)};
    animation: ${smoothRise} 0.5s ease-out;
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
    animation: ${maskedRise} 0.7s ease-out;
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
    Types
----------------------------------------------------- */

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

    const [isMobile, setIsMobile] = useState(
        window.innerWidth <= 768
    );

    /* Responsive listener */
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    /* Load profile + ML prediction */
    const loadPrediction = useCallback(async () => {
        try {
            const res = await axiosClient.get<MeResponse>("/api/auth/me");
            const u = res.data.user;

            if (!u) throw new Error("Missing user");

            const pred = await axiosClient.post<PredictResponse>(
                "/api/ml/predict",
                {
                    pulling_severity: u.pulling_severity ?? 5,
                    pulling_frequency_encoded: u.pulling_frequency_encoded ?? 3,
                    awareness_level_encoded: u.awareness_level_encoded ?? 0.5,
                    how_long_stopped_days_est: u.how_long_stopped_days_est ?? 14,
                    successfully_stopped_encoded: u.successfully_stopped_encoded ?? 0,
                    years_since_onset: u.years_since_onset ?? 8,
                    age: u.age ?? 30,
                    age_of_onset: u.age_of_onset ?? 18,
                    emotion_intensity_sum: u.emotion_intensity_sum ?? 4.5
                }
            );

            setRiskScore(pred.data.risk_score);
            setConfidence(pred.data.confidence);
            setBucket(
                String(pred.data.risk_bucket).toUpperCase() as RiskLevel
            );
        } catch {
            navigate("/login");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (!isAuthenticated) return;
        loadPrediction();
    }, [isAuthenticated, loadPrediction]);

    /* Quotes hook */
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
        model_version: "v1.0.0"
    };

    return (
        <PageWrapper>
            {/* HEADER */}
            <Header>
                <Link to="/">
                    <img src={AppLogo} alt="TrichMind Logo" height={50} />
                </Link>

                <details>
                    <summary>
                        <img src={UserIcon} alt="Account" height={36} />
                    </summary>
                    <nav>
                        <Link to="/profile">Profile</Link>
                        <button onClick={() => { logout(); navigate("/login"); }}>
                            Logout
                        </button>
                    </nav>
                </details>
            </Header>

            {/* CARD 1 */}
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

            {/* CARD 2 */}
            <Section $delay={300}>
                <DailyProgressCardAuto />
            </Section>

            {/* CARD 3 */}
            <Section $delay={450}>
                <CopingStrategiesCard />
            </Section>

            {/* CARD 4 */}
            <DashboardSection $delay={650}>
                <h2>📈 Relapse Risk Analytics</h2>
                <RiskTrendChart />
            </DashboardSection>
        </PageWrapper>
    );
};

export default HomePage;
