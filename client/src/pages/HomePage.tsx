// client/src/pages/HomePage.tsx

import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
// Component
// ──────────────────────────────
export default function HomePage() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [riskScore, setRiskScore] = useState<number>(0);
    const [confidence, setConfidence] = useState<number>(0);
    const [bucket, setBucket] = useState<RiskLevel>("MEDIUM");
    const [loading, setLoading] = useState<boolean>(true);

    // ──────────────────────────────
    // 🧩 Load user & predict risk
    // ──────────────────────────────
    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate("/login");
            return;
        }

        (async () => {
            try {
                const { data } = await axiosClient.get("/auth/me");

                // Construct ML-ready payload
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

                // ML prediction request
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

    // ──────────────────────────────
    // 💬 Motivational message
    // ──────────────────────────────
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

    // ──────────────────────────────
    // 🩺 Render UI
    // ──────────────────────────────
    if (!isAuthenticated) {
        navigate("/login");
        return null;
    }

    if (loading) return <p>Loading your personalized home page...</p>;
    if (!user) return <p>Unable to load user profile.</p>;

    // Build the PredictResponse-style data object
    const predictionData = {
        risk_score: riskScore,
        risk_bucket: bucket.toLowerCase(),
        risk_code: bucket === "HIGH" ? 2 : bucket === "MEDIUM" ? 1 : 0,
        confidence,
        model_version: "v1.0.0",
    };

    return (
        <div className="homeContainer">
            {/* 🧭 Header */}
            <div className="topBar">
                <Link to="/" aria-label="Home" className="logo-link">
                    <img
                        src="/assets/images/app_logo.png"
                        alt="TrichMind"
                        className="app_logo"
                    />
                </Link>

                <details className="user-menu-wrap">
                    <summary className="user-button" aria-label="Account menu">
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
                                localStorage.removeItem("auth_token");
                                localStorage.removeItem("user");
                                navigate("/login");
                            }}
                        >
                            Logout
                        </button>
                    </nav>
                </details>
            </div>

            {/* 🎯 Welcome */}
            <h2 className="welcome-text">
                Welcome back, {user.displayName || user.email || "Friend"} 👋
            </h2>

            {/* 🧠 Risk Summary */}
            <RiskResultCard data={predictionData} quote={quote} />

            {/* 🔁 Daily Progress (auto-fetched) */}
            <DailyProgressCardAuto />

            {/* 💪 Coping Strategies */}
            <CopingStrategiesCard
                worked={["Fidget toy", "Deep breathing"]}
                notWorked={["Journaling"]}
            />

            {/* 📊 Risk Trend (self-fetching) */}
            <div className="dashboard">
                <h2>📈 Relapse Risk Analytics</h2>
                <RiskTrendChart />
            </div>
        </div>
    );
}
