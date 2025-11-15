// client/src/components/RegisterPredictForm.tsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  ThemeButton,
  FormInput,
} from "@/components";
import { useRegisterAndPredict } from "@/hooks";


// Styled Components
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

const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const PopupBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
`;

const PopupTitle = styled.h2`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const PopupText = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text_primary};
  margin-bottom: 1.5rem;
`;

export const RegisterPredictForm: React.FC = () => {
  const { registerAndPredict, submitting, submitError } =
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

  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await registerAndPredict(form);

    if (result) {
      setShowPopup(true);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    navigate("/login");
  };

  return (
    <>
      {showPopup && (
        <PopupOverlay>
          <PopupBox>
            <PopupTitle>🎉 Welcome to TrichMind!</PopupTitle>
            <PopupText>
              Your account has been created successfully.<br /><br />
              Please <strong>log in</strong> to view your personalized relapse risk prediction
              and continue your journey with supportive tools.
            </PopupText>

            <ThemeButton onClick={closePopup}>
              Go to Login
            </ThemeButton>
          </PopupBox>
        </PopupOverlay>
      )}

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
          required
        />

        <FormInput
          name="age_of_onset"
          label="Age of Onset"
          type="number"
          min={0}
          max={120}
          value={form.age_of_onset}
          onChange={handleChange}
          required
        />

        <FormInput
          name="years_since_onset"
          label="Years Since Onset"
          type="number"
          min={0}
          max={120}
          value={form.years_since_onset}
          onChange={handleChange}
          required
        />

        <SectionTitle>🧠 Behavior & Emotions</SectionTitle>

        <FormInput
          name="pulling_severity"
          label="Pulling Severity (1–10)"
          type="number"
          min={1}
          max={10}
          value={form.pulling_severity}
          onChange={handleChange}
          required
        />

        <FormInput
          name="pulling_frequency"
          label="How often do you pull?"
          placeholder="e.g. daily, weekly, monthly, rarely"
          value={form.pulling_frequency}
          onChange={handleChange}
          required
        />

        <FormInput
          name="pulling_awareness"
          label="Awareness while pulling"
          placeholder="e.g. eyes, sometimes, no"
          value={form.pulling_awareness}
          onChange={handleChange}
          required
        />

        <FormInput
          name="successfully_stopped"
          label="Successfully stopped?"
          placeholder="e.g. yes, no"
          value={form.successfully_stopped}
          onChange={handleChange}
          required
        />

        <FormInput
          name="how_long_stopped_days"
          label="How long stopped (days)"
          type="number"
          min={0}
          value={form.how_long_stopped_days}
          onChange={handleChange}
          required
        />

        <FormInput
          name="emotion"
          label="Current Emotion"
          placeholder="e.g. anxious, calm, stressed"
          value={form.emotion}
          onChange={handleChange}
          required
        />

        <ThemeButton type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Register & Predict Relapse Risk"}
        </ThemeButton>

        {submitError && <ErrorMessage>{submitError}</ErrorMessage>}

        <FooterText>
          Already have an account? <Link to="/login">Login</Link>
        </FooterText>
      </FormContainer>
    </>
  );
};

export default RegisterPredictForm;
