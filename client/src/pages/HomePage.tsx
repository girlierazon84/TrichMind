// client/src/pages/HomePage.tsx

import { useEffect, useState, useMemo } from "react";
import type { ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { authApi } from "../api/authApi";
import { mlApi } from "../api/mlApi";
import RiskCard from "../components/RiskCard";
import DailyProgressCard from "../components/DailyProgressCard";
import CopingStrategiesCard from "../components/CopingStrategiesCard";
import RiskTrendChart from "../components/RiskTrendChart";
import appLogo from "/assets/images/app_logo.png";
import userIcon from "/assets/icons/user.png";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export default function Home() {
    const navigate = useNavigate();

    const [user, setUser] = useState<any>(null);
    const [riskScore, setRiskScore] = useState(0);
    const [confidence, setConfidence] = useState(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔹 Authenticate user and fetch ML prediction
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        (async () => {
            try {
                const data = await authApi.me(token);
                setUser(data);

                // Build ML payload
                const payload = {
                    pulling_severity: data.pulling_severity ?? 5,
                    pulling_frequency_encoded: data.pulling_frequency_encoded ?? 3,
                    awareness_level_encoded: data.awareness_level_encoded ?? 0.5,
                    how_long_stopped_days_est: data.how_long_stopped_days_est ?? 14,
                    successfully_stopped_encoded: data.successfully_stopped_encoded ? 1 : 0,
                    years_since_onset: data.years_since_onset ?? 8,
                    age: data.age ?? 30,
                    age_of_onset: data.age_of_onset ?? 18,
                    emotion: data.emotion ?? "neutral",
                };

                const prediction = await mlApi.predict(payload);

                setRiskScore(prediction.risk_score);
                setConfidence(prediction.confidence);
                setBucket(prediction.risk_bucket);
            } catch (err) {
                console.error("⚠️ Failed to load user or prediction:", err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    // 🔹 Fetch relapse trend data (example endpoint)
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/health/risk-trend");
                const data = await res.json();
                setTrendData(data);
            } catch (err) {
                console.error("⚠️ Failed to load trend data:", err);
            }
        })();
    }, []);

    // 🔹 Motivational quote
    const quote = useMemo(() => {
        if (bucket === "LOW") return "You're doing great — stay mindful and steady.";
        if (bucket === "MEDIUM") return "Notice your triggers early — small wins matter.";
        return "This is a moment to pause, breathe, and refocus — you've got this.";
    }, [bucket]);

    // 🔹 UI
        if (loading) return <LoadingText>Loading your personalized dashboard...</LoadingText>;
        if (!user) return <LoadingText>Unable to load user profile.</LoadingText>;

        // Ensure RiskTrendChart is treated as a component that accepts a `data` prop when its types are not exported/available.
        const RiskTrendChartTyped = RiskTrendChart as unknown as ComponentType<{ data: any[] }>;

        return (
            <PageContainer>
                {/* Header */}
                <TopBar>
                    <LogoLink to="/" aria-label="Home">
                        <Logo src={appLogo} alt="TrichMind" />
                    </LogoLink>

                    <UserMenu>
                        <SummaryButton>
                            <UserIcon src={userIcon} alt="Account" />
                        </SummaryButton>
                        <MenuList>
                            <MenuItem as={Link} to="/profile">Profile</MenuItem>
                            <MenuItem
                                as="button"
                                onClick={() => {
                                    localStorage.removeItem("token");
                                    localStorage.removeItem("user");
                                    navigate("/login");
                                }}
                            >
                                Logout
                            </MenuItem>
                        </MenuList>
                    </UserMenu>
                </TopBar>

                <WelcomeText>Welcome back, {user.displayName || "Friend"} 👋</WelcomeText>

                <RiskCard score={riskScore} bucket={bucket} confidence={confidence} quote={quote} />

                <DailyProgressCard />

                {/* bypass TS prop type mismatch on the component (typed in its module) */}
                <CopingStrategiesCard {...({ worked: ["Fidget toy", "Deep breathing"], notWorked: ["Journaling"] } as any)} />

                <DashboardSection>
                    <h2>📈 Relapse Risk Analytics</h2>
                    <RiskTrendChartTyped data={trendData} />
                </DashboardSection>
            </PageContainer>
        );
}

/* 🌿 Styled Components */

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%);
    padding: 1.5rem;
    animation: ${fadeIn} 0.6s ease-in-out;
`;

const TopBar = styled.div`
    width: 100%;
    max-width: 960px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
`;

const LogoLink = styled(Link)`
    text-decoration: none;
`;

const Logo = styled.img`
    width: 60px;
    height: 60px;
    object-fit: contain;
`;

const UserMenu = styled.details`
    position: relative;
`;

const SummaryButton = styled.summary`
    list-style: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
`;

const UserIcon = styled.img`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    transition: transform 0.2s ease;
    &:hover {
        transform: scale(1.1);
    }
`;

const MenuList = styled.nav`
    position: absolute;
    right: 0;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    margin-top: 0.5rem;
    padding: 0.5rem 0;
    z-index: 10;
`;

const MenuItem = styled.button`
    all: unset;
    padding: 0.6rem 1.2rem;
    color: #374151;
    font-size: 0.9rem;
    cursor: pointer;
    &:hover {
        background: #f3f4f6;
        color: #2563eb;
    }
`;

const WelcomeText = styled.h2`
    font-size: 1.4rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
`;

const DashboardSection = styled.div`
    margin-top: 2rem;
    width: 100%;
    max-width: 960px;
    text-align: center;
    background: #ffffff;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);

    h2 {
        color: #1f2937;
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }
`;

const LoadingText = styled.p`
    text-align: center;
    color: #6b7280;
    margin-top: 3rem;
    font-size: 1rem;
`;
