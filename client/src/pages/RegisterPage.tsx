// client/src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import axiosClient from "../api/axiosClient";
import { mlApi } from "../api/mlApi";
import type { MLPredictionResponse } from "../api/mlApi";
import FormInput from "../components/FormInput";
import RiskCard from "../components/RiskCard";

export default function RegisterPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
        displayName: "",
        date_of_birth: "",
        age_of_onset: "0",
        years_since_onset: "0",
        pulling_severity: "0",
        pulling_frequency_encoded: "0",
        awareness_level_encoded: "0",
        successfully_stopped_encoded: false,
        how_long_stopped_days_est: "0",
        emotion: "",
    });

    const [prediction, setPrediction] = useState<MLPredictionResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, type, value, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const calculateAge = (dob: string): number => {
        if (!dob) return 0;
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosClient.post("/auth/register", { ...form });

            const payload = {
                pulling_severity: Number(form.pulling_severity),
                pulling_frequency_encoded: Number(form.pulling_frequency_encoded),
                awareness_level_encoded: Number(form.awareness_level_encoded),
                how_long_stopped_days_est: Number(form.how_long_stopped_days_est),
                successfully_stopped_encoded: form.successfully_stopped_encoded ? 1 : 0,
                years_since_onset: Number(form.years_since_onset),
                age: calculateAge(form.date_of_birth),
                age_of_onset: Number(form.age_of_onset),
                emotion: form.emotion || "neutral",
            };

            const result = await mlApi.predict(payload);
            const maybeWrapped = (result as any)?.prediction ?? result;
            setPrediction(maybeWrapped as MLPredictionResponse);
        } catch (err: any) {
            console.error("Registration or prediction failed:", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <Title>Create Account</Title>

            <FormContainer onSubmit={handleSubmit}>
                <InputGroup>
                    <LabelRow>
                        <Label>Email</Label>
                        <Hint>Used for login and recovery</Hint>
                    </LabelRow>
                    <FormInput name="email" type="email" value={form.email} onChange={handleChange} required />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Password</Label>
                        <Hint>At least 6 characters</Hint>
                    </LabelRow>
                    <FormInput name="password" type="password" value={form.password} onChange={handleChange} required />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Display Name</Label>
                        <Hint>Nickname in the app</Hint>
                    </LabelRow>
                    <FormInput name="displayName" value={form.displayName} onChange={handleChange} />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Date of Birth</Label>
                        <Hint>Used to calculate age</Hint>
                    </LabelRow>
                    <FormInput name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Pulling Severity (0–10)</Label>
                        <Hint>0 = none, 10 = very strong</Hint>
                    </LabelRow>
                    <FormInput name="pulling_severity" type="number" value={form.pulling_severity} onChange={handleChange} />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Pulling Frequency (0–5)</Label>
                        <Hint>0 = never, 5 = very frequent</Hint>
                    </LabelRow>
                    <FormInput name="pulling_frequency_encoded" type="number" value={form.pulling_frequency_encoded} onChange={handleChange} />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Awareness Level (0–1)</Label>
                        <Hint>0 = unaware, 1 = aware</Hint>
                    </LabelRow>
                    <FormInput name="awareness_level_encoded" type="number" value={form.awareness_level_encoded} onChange={handleChange} />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Years Since Onset</Label>
                        <Hint>How long since it began</Hint>
                    </LabelRow>
                    <FormInput name="years_since_onset" type="number" value={form.years_since_onset} onChange={handleChange} />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Age of Onset</Label>
                        <Hint>Your age when it started</Hint>
                    </LabelRow>
                    <FormInput name="age_of_onset" type="number" value={form.age_of_onset} onChange={handleChange} />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Days Since Last Pull</Label>
                        <Hint>Approximate estimate</Hint>
                    </LabelRow>
                    <FormInput name="how_long_stopped_days_est" type="number" value={form.how_long_stopped_days_est} onChange={handleChange} />
                </InputGroup>

                <InputGroup>
                    <LabelRow>
                        <Label>Current Emotion</Label>
                        <Hint>Optional mood note</Hint>
                    </LabelRow>
                    <FormInput name="emotion" value={form.emotion} onChange={handleChange} />
                </InputGroup>

                <CheckboxRow>
                    <input
                        id="successfully_stopped_encoded"
                        title="Have you successfully stopped?"
                        type="checkbox"
                        name="successfully_stopped_encoded"
                        checked={form.successfully_stopped_encoded}
                        onChange={handleChange}
                    />
                    <span>Have you successfully stopped before?</span>
                </CheckboxRow>

                <SubmitButton type="submit" disabled={loading}>
                    {loading ? "Predicting..." : "Register & Predict"}
                </SubmitButton>

                <SmallText>
                    Already have an account? <StyledLink to="/login">Login</StyledLink>
                </SmallText>
            </FormContainer>

            {prediction && (
                <AnimatedRiskWrapper>
                    <RiskCard
                        score={prediction.risk_score}
                        confidence={prediction.confidence}
                        bucket={prediction.risk_bucket}
                    />
                </AnimatedRiskWrapper>
            )}
        </PageContainer>
    );
}

/* 🌿 Styled Components */

const PageContainer = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.2rem;
    background: linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%);
`;

const Title = styled.h1`
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #1f2937;
`;

const FormContainer = styled.form`
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    width: 100%;
    max-width: 440px;
    background: white;
    border-radius: 16px;
    padding: 1.6rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
`;

const LabelRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.1rem;
`;

const Label = styled.label`
    font-size: 0.85rem;
    font-weight: 500;
    color: #374151;
`;

const Hint = styled.span`
    font-size: 0.7rem;
    color: #9ca3af;
    font-style: italic;
    vertical-align: sub;
`;

const CheckboxRow = styled.label`
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: #374151;
    margin: 0.6rem 5rem 0.6rem 0;
    input {
        transform: scale(1.2);
    }
`;

const SubmitButton = styled.button`
    margin-top: 0.8rem;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 0.7rem 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease;
    &:hover {
        background-color: #1d4ed8;
    }
    &:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
    }
`;

const SmallText = styled.p`
    text-align: center;
    font-size: 0.85rem;
    margin-top: 0.6rem;
    color: #4b5563;
`;

const StyledLink = styled(Link)`
    color: #2563eb;
    text-decoration: underline;
    &:hover {
        color: #1d4ed8;
    }
`;

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
`;

const AnimatedRiskWrapper = styled.div`
    margin-top: 1.5rem;
    width: 100%;
    max-width: 440px;
    animation: ${fadeIn} 0.6s ease-in-out;
`;
