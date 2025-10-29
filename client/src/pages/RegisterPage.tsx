import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { RiskCard } from "../components/RiskCard";
import FormInput from "../components/FormInput";
import "../utils/global/styling.css";

export default function RegisterPage() {
    const navigate = useNavigate();

    const initialFormState = {
        email: "",
        password: "",
        displayName: "",
        date_of_birth: "",
        age: "",
        age_of_onset: "",
        years_since_onset: "",
        pulling_severity: "",
        pulling_frequency_encoded: "",
        awareness_level_encoded: "",
        successfully_stopped_encoded: false,
        how_long_stopped_days_est: "",
        emotion: "",
    };

    const [form, setForm] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [riskResult, setRiskResult] = useState<any>(null);

    // ── Helpers ────────────────────────────
    const calcAge = (dobStr: string) => {
        if (!dobStr) return 0;
        const dob = new Date(dobStr);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const hadBday =
            today.getMonth() > dob.getMonth() ||
            (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
        if (!hadBday) age -= 1;
        return Math.max(0, age);
    };

    const clamp = (v: number, min: number, max: number) =>
        Math.min(max, Math.max(min, v));

    const toNum = (v: any): number | undefined => {
        if (v === null || v === undefined || v === "") return undefined;
        const n = Number(String(v).replace("%", "").trim());
        return Number.isFinite(n) ? n : undefined;
    };

    // ── Auto-update derived fields ────────────────────────────
    useEffect(() => {
        if (form.date_of_birth) {
            const age = calcAge(form.date_of_birth);
            const onset = toNum(form.age_of_onset);
            const yearsSince =
                age !== undefined && onset !== undefined && onset >= 0
                    ? Math.max(0, age - onset)
                    : undefined;

            setForm((prev) => ({
                ...prev,
                age: age !== undefined ? String(age) : prev.age,
                years_since_onset:
                    yearsSince !== undefined
                        ? String(yearsSince)
                        : prev.years_since_onset,
            }));
        }
    }, [form.date_of_birth, form.age_of_onset]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, type, value } = e.target;
        setForm({
            ...form,
            [name]:
                type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        });
    };

    // ── Normalize ML response ─────────────────────
    const normalizePrediction = (raw: any) => {
        const d = raw?.data ?? raw ?? {};
        let score = Number(d.risk_score);
        if (isNaN(score)) score = 0;
        let confidence = Number(d.confidence);
        if (isNaN(confidence)) confidence = Math.abs(score - 0.5) * 2;
        const bucket = (d.risk_bucket ?? d.bucket ?? "MEDIUM").toString().toUpperCase();
        return { score, confidence, bucket };
    };

    // ── ML Risk Prediction ────────────────────────
    const getRelapseRisk = async (mlPayload: any) => {
        const { data } = await axiosClient.post("/ml/predict", mlPayload);
        const normalized = normalizePrediction(data);
        setRiskResult(normalized);
    };

    // ── Registration Submit ───────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setRiskResult(null);

        try {
            const safeAge = calcAge(form.date_of_birth) ?? 0;
            const safeOnset = clamp(toNum(form.age_of_onset) ?? 0, 0, 120);
            const safeYearsSince = Math.max(0, safeAge - safeOnset);
            const safeSeverity = clamp(toNum(form.pulling_severity) ?? 0, 0, 10);
            const safeFreq = clamp(toNum(form.pulling_frequency_encoded) ?? 0, 0, 5);
            const safeAware = clamp(toNum(form.awareness_level_encoded) ?? 0, 0, 1);
            const safeStopped = form.successfully_stopped_encoded ? 1 : 0;
            const safeStoppedDays = Math.max(
                0,
                toNum(form.how_long_stopped_days_est) ?? 0
            );

            const allowedEmotions = new Set([
                "anxious",
                "bored",
                "stressed",
                "tired",
                "neutral",
                "sad",
                "angry",
                "calm",
            ]);
            const emotion = allowedEmotions.has((form.emotion || "").toLowerCase())
                ? (form.emotion as string).toLowerCase()
                : "neutral";

            const mlPayload = {
                pulling_severity: safeSeverity,
                pulling_frequency_encoded: safeFreq,
                awareness_level_encoded: safeAware,
                how_long_stopped_days_est: safeStoppedDays,
                successfully_stopped_encoded: safeStopped,
                years_since_onset: safeYearsSince,
                age: safeAge,
                age_of_onset: safeOnset,
                emotion,
            };

            // 1️⃣ Predict relapse risk
            await getRelapseRisk(mlPayload);

            // 2️⃣ Register user
            const registerPayload = {
                ...form,
                email: form.email.trim().toLowerCase(),
                age: safeAge,
                age_of_onset: safeOnset,
                years_since_onset: safeYearsSince,
                pulling_severity: safeSeverity,
                pulling_frequency_encoded: safeFreq,
                awareness_level_encoded: safeAware,
                successfully_stopped_encoded: !!safeStopped,
                how_long_stopped_days_est: safeStoppedDays,
                emotion,
            };

            const { data } = await axiosClient.post("/auth/register", registerPayload);

            if (data.ok) {
                alert("✅ Registration successful! Please log in.");
                setForm(initialFormState);
                navigate("/login");
            } else {
                alert("Registration failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("❌ Registration failed:", err);
            alert("Registration failed. Please check your input and try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── UI ────────────────────────────────────────
    return (
        <div className="auth-container">
            <img
                src="/assets/images/app_logo.png"
                alt="TrichMind Logo"
                className="auth-logo"
            />
            <h2 className="auth-title">Create Your TrichMind Account</h2>
            <p className="auth-subtitle">
                Build your profile to personalize your mental health insights
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
                <FormInput
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    placeholder="Enter your email"
                    onChange={handleChange}
                    required
                    disabled={loading}
                />

                <FormInput
                    label="Password"
                    name="password"
                    type="password"
                    value={form.password}
                    placeholder="Enter your password"
                    onChange={handleChange}
                    required
                    disabled={loading}
                />

                <FormInput
                    label="Display Name"
                    name="displayName"
                    type="text"
                    value={form.displayName}
                    placeholder="Your name or nickname"
                    onChange={handleChange}
                    disabled={loading}
                />

                <FormInput
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    required
                    disabled={loading}
                />

                <FormInput
                    label="Age (Auto Calculated)"
                    name="age"
                    type="number"
                    value={form.age}
                    onChange={handleChange}
                    disabled
                />

                <FormInput
                    label="Age of Onset"
                    name="age_of_onset"
                    type="number"
                    value={form.age_of_onset}
                    onChange={handleChange}
                    placeholder="e.g. 17"
                    required
                    disabled={loading}
                />

                <FormInput
                    label="Years Since Onset (Auto)"
                    name="years_since_onset"
                    type="number"
                    value={form.years_since_onset}
                    onChange={handleChange}
                    disabled
                />

                <FormInput
                    label="Pulling Severity (0–10)"
                    name="pulling_severity"
                    type="number"
                    value={form.pulling_severity}
                    onChange={handleChange}
                    placeholder="Enter severity (0–10)"
                    disabled={loading}
                />

                <label>Pulling Frequency</label>
                <select
                    id="pulling_frequency"
                    title="Pulling Frequency"
                    name="pulling_frequency_encoded"
                    value={form.pulling_frequency_encoded}
                    onChange={handleChange}
                    disabled={loading}
                >
                    <option value="">Select</option>
                    <option value="1">Rarely (1)</option>
                    <option value="2">Occasionally (2)</option>
                    <option value="3">Frequently (3)</option>
                    <option value="4">Daily (4)</option>
                    <option value="5">Constant (5)</option>
                </select>

                <label>Awareness Level</label>
                <select
                    id="awareness_level"
                    title="Awareness Level"
                    name="awareness_level_encoded"
                    value={form.awareness_level_encoded}
                    onChange={handleChange}
                    disabled={loading}
                >
                    <option value="">Select</option>
                    <option value="0">Unaware</option>
                    <option value="0.25">Occasionally Aware</option>
                    <option value="0.5">Somewhat Aware</option>
                    <option value="0.75">Mostly Aware</option>
                    <option value="1">Fully Aware</option>
                </select>

                <label>Emotion Before Pulling</label>
                <select
                    id="emotion"
                    title="Emotion Before Pulling"
                    name="emotion"
                    value={form.emotion}
                    onChange={handleChange}
                    disabled={loading}
                >
                    <option value="">Select Emotion</option>
                    <option value="anxious">Anxious</option>
                    <option value="bored">Bored</option>
                    <option value="stressed">Stressed</option>
                    <option value="tired">Tired</option>
                    <option value="neutral">Neutral</option>
                    <option value="sad">Sad</option>
                    <option value="angry">Angry</option>
                    <option value="calm">Calm</option>
                </select>

                <label className="checkbox-field">
                    <input
                        type="checkbox"
                        name="successfully_stopped_encoded"
                        checked={form.successfully_stopped_encoded}
                        onChange={handleChange}
                        disabled={loading}
                    />
                    Have you successfully stopped pulling before?
                </label>

                <FormInput
                    label="How long have you stopped (days)"
                    name="how_long_stopped_days_est"
                    type="number"
                    value={form.how_long_stopped_days_est}
                    onChange={handleChange}
                    placeholder="e.g., 30"
                    disabled={loading}
                />

                <button
                    type="submit"
                    className={`auth-button ${loading ? "loading" : ""}`}
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Register"}
                </button>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login" className="auth-link">
                        Log In
                    </Link>
                </p>
            </form>

            {riskResult && (
                <div style={{ marginTop: "2rem" }}>
                    <RiskCard
                        score={riskResult.score}
                        bucket={riskResult.bucket}
                        confidence={riskResult.confidence}
                    />
                </div>
            )}
        </div>
    );
}
