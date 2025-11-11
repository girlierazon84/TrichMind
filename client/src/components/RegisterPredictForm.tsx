// client/src/components/RegisterPredictForm.tsx

import React, { useState } from "react";
import styled from "styled-components";
import { ThemedButton } from "@/components/ThemeButton";
import { useRegisterAndPredict } from "@/hooks/useRegisterAndPredict";
import { FormInput } from "@/components/FormInput";
import { ResultCard } from "@/components/ResultCard";

// ──────────────────────────────
// Styled Components
// ──────────────────────────────
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: ${({ theme }) => theme.colors.card_bg};
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .checkbox {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.high_risk};
  font-weight: 500;
`;

const SuccessMessage = styled.p`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
`;

// ──────────────────────────────
// Component
// ──────────────────────────────
export function RegisterPredictForm() {
  const { registerAndPredict, submitting, submitError, prediction } = useRegisterAndPredict();

  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    date_of_birth: "",
    age_of_onset: "",
    years_since_onset: "",
    pulling_severity: "",
    pulling_frequency_encoded: "",
    awareness_level_encoded: "",
    successfully_stopped_encoded: false,
    how_long_stopped_days_est: "",
    emotion: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLSelectElement;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerAndPredict(form);
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <SectionTitle>👤 Account Details</SectionTitle>
      <FormInput
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <FormInput
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <FormInput
        label="Display Name"
        name="displayName"
        value={form.displayName}
        onChange={handleChange}
      />

      <SectionTitle>📅 Background</SectionTitle>
      <FormInput
        label="Date of Birth"
        name="date_of_birth"
        type="date"
        value={form.date_of_birth}
        onChange={handleChange}
      />
      <FormInput
        label="Age of Onset"
        name="age_of_onset"
        type="number"
        value={form.age_of_onset}
        onChange={handleChange}
      />
      <FormInput
        label="Years Since Onset"
        name="years_since_onset"
        type="number"
        value={form.years_since_onset}
        onChange={handleChange}
      />

      <SectionTitle>🧠 Behavior & Emotions</SectionTitle>
      <FormInput
        label="Pulling Severity (1–10)"
        name="pulling_severity"
        type="number"
        value={form.pulling_severity}
        onChange={handleChange}
      />
      <FormInput
        label="Pulling Frequency Encoded"
        name="pulling_frequency_encoded"
        type="number"
        value={form.pulling_frequency_encoded}
        onChange={handleChange}
      />
      <FormInput
        label="Awareness Level Encoded"
        name="awareness_level_encoded"
        type="number"
        value={form.awareness_level_encoded}
        onChange={handleChange}
      />
      <FormInput
        label="How Long Stopped (days)"
        name="how_long_stopped_days_est"
        type="number"
        value={form.how_long_stopped_days_est}
        onChange={handleChange}
      />
      <FormInput
        label="Emotion"
        name="emotion"
        value={form.emotion}
        onChange={handleChange}
        placeholder="e.g. anxious, calm"
      />
      <label className="checkbox">
        <input
          type="checkbox"
          name="successfully_stopped_encoded"
          checked={form.successfully_stopped_encoded}
          onChange={handleChange}
        />{" "}
        Successfully stopped before?
      </label>

      <ThemedButton type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Register & Predict"}
      </ThemedButton>

      {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
      {prediction && (
        <>
          <SuccessMessage>Prediction Completed 🎯</SuccessMessage>
          <ResultCard result={prediction} />
        </>
      )}
    </FormContainer>
  );
}
