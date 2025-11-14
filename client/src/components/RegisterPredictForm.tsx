// client/src/components/RegisterPredictForm.tsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  ThemeButton,
  FormInput,
  RiskResultCard
} from "@/components";
import { useRegisterAndPredict } from "@/hooks";


const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: ${({ theme }) => theme.colors.card_bg};
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

const FooterText = styled.p`
  margin-top: 1rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text_secondary};

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.secondary};
    }
  }
`;

export const RegisterPredictForm: React.FC = () => {
  const { registerAndPredict, submitting, submitError, prediction } =
    useRegisterAndPredict();

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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerAndPredict(form);
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <SectionTitle>👤 Account Details</SectionTitle>

      <FormInput
        name="email"
        label="Email"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
      />

      <FormInput
        name="password"
        label="Password"
        type="password"
        value={form.password}
        onChange={handleChange}
        required
      />

      <FormInput
        name="displayName"
        label="Display Name"
        type="text"
        value={form.displayName}
        onChange={handleChange}
      />

      <SectionTitle>📅 Background</SectionTitle>

      <FormInput
        name="date_of_birth"
        label="Date of Birth"
        type="date"
        value={form.date_of_birth}
        onChange={handleChange}
      />

      <FormInput
        name="age_of_onset"
        label="Age of Onset"
        type="number"
        value={form.age_of_onset}
        onChange={handleChange}
      />

      <FormInput
        name="years_since_onset"
        label="Years Since Onset"
        type="number"
        value={form.years_since_onset}
        onChange={handleChange}
      />

      <SectionTitle>🧠 Behavior & Emotions</SectionTitle>

      <FormInput
        name="pulling_severity"
        label="Pulling Severity (1–10)"
        type="number"
        value={form.pulling_severity}
        onChange={handleChange}
      />

      <FormInput
        name="pulling_frequency"
        label="How often do you pull?"
        placeholder="daily, weekly, rarely"
        value={form.pulling_frequency}
        onChange={handleChange}
      />

      <FormInput
        name="pulling_awareness"
        label="Awareness while pulling"
        placeholder="yes, sometimes, no"
        value={form.pulling_awareness}
        onChange={handleChange}
      />

      <FormInput
        name="successfully_stopped"
        label="Successfully stopped?"
        placeholder="yes or no"
        value={form.successfully_stopped}
        onChange={handleChange}
      />

      <FormInput
        name="how_long_stopped_days"
        label="How long stopped (days)"
        type="number"
        value={form.how_long_stopped_days}
        onChange={handleChange}
      />

      <FormInput
        name="emotion"
        label="Current Emotion"
        placeholder="anxious, calm, stressed"
        value={form.emotion}
        onChange={handleChange}
      />

      <ThemeButton type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Register & Predict Relapse Risk"}
      </ThemeButton>

      {submitError && <ErrorMessage>{submitError}</ErrorMessage>}

      {prediction && (
        <>
          <SuccessMessage>Prediction Completed 🎯</SuccessMessage>
          <RiskResultCard data={prediction} />
        </>
      )}

      <FooterText>
        Already have an account? <Link to="/login">Login</Link>
      </FooterText>
    </FormContainer>
  );
};

export default RegisterPredictForm;
