// client/src/components/RegisterPredictForm.tsx

import React, { useState } from "react";
import styled from "styled-components";
import { ThemeButton, FormInput, ResultCard } from "@/components";
import { useRegisterAndPredict, useAuth, useUser } from "@/hooks";

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

  label {
    text-align: justify;
  }

  ::placeholder {
    font-style: italic;
    font-size: 0.85rem;
    opacity: 0.8;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
  text-align: left;
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
export const RegisterPredictForm: React.FC = () => {
  const { register } = useAuth();
  const { updateProfile } = useUser();
  const { registerAndPredict, submitting, submitError, prediction } =
    useRegisterAndPredict();

  // Human-friendly form state
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    date_of_birth: "",
    age_of_onset: "",
    years_since_onset: "",
    pulling_severity: "",
    pulling_frequency: "",
    pulling_awareness: "",
    successfully_stopped: "",
    how_long_stopped_days: "",
    emotion: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 1: Register user
    const authResponse = await register({
      email: form.email,
      password: form.password,
      displayName: form.displayName,
    });

    if (!authResponse) return;

    // Step 2: Update user profile (optional)
    await updateProfile({
      emotion: form.emotion,
      pulling_severity: Number(form.pulling_severity),
      age: form.date_of_birth
        ? new Date().getFullYear() -
          new Date(form.date_of_birth).getFullYear()
        : undefined,
    });

    // Step 3: Run prediction — reuse your form object
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
        type="text"
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
        min={0}
        max={120}
        value={form.age_of_onset}
        onChange={handleChange}
      />
      <FormInput
        label="Years Since Onset"
        name="years_since_onset"
        type="number"
        min={0}
        max={120}
        value={form.years_since_onset}
        onChange={handleChange}
      />

      <SectionTitle>🧠 Behavior & Emotions</SectionTitle>
      <FormInput
        label="Pulling Severity (1–10)"
        name="pulling_severity"
        type="number"
        min={1}
        max={10}
        value={form.pulling_severity}
        onChange={handleChange}
      />
      <FormInput
        label="How often do you pull?"
        name="pulling_frequency"
        type="text"
        placeholder="e.g. daily, weekly, rarely"
        value={form.pulling_frequency}
        onChange={handleChange}
      />
      <FormInput
        label="Awareness while pulling"
        name="pulling_awareness"
        type="text"
        placeholder="e.g. yes, sometimes, no"
        value={form.pulling_awareness}
        onChange={handleChange}
      />
      <FormInput
        label="Successfully stopped?"
        name="successfully_stopped"
        type="text"
        placeholder="e.g. yes, no"
        value={form.successfully_stopped}
        onChange={handleChange}
      />
      <FormInput
        label="How Long Stopped (days)"
        name="how_long_stopped_days"
        type="number"
        placeholder="number of days since last pulling episode"
        value={form.how_long_stopped_days}
        onChange={handleChange}
      />
      <FormInput
        label="Current Emotion"
        name="emotion"
        type="text"
        placeholder="e.g. anxious, calm, stressed"
        value={form.emotion}
        onChange={handleChange}
      />

      <ThemeButton type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Register & Predict"}
      </ThemeButton>

      {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
      {prediction && (
        <>
          <SuccessMessage>Prediction Completed 🎯</SuccessMessage>
          <ResultCard result={prediction} />
        </>
      )}
    </FormContainer>
  );
};

export default RegisterPredictForm;
