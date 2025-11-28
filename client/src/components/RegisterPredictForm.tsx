// client/src/components/RegisterPredictForm.tsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { ThemeButton, FormInput } from "@/components";
import { useRegisterAndPredict } from "@/hooks";
import { UserIcon, BrainIcon, StrategyIcon } from "@/assets/icons";

/**-------------------------------------
    ANIMATIONS — calm, premium, soft
----------------------------------------*/
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const popupAppear = keyframes`
  from { opacity: 0; transform: translateY(30px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/**----------------------
    Styled Components
-------------------------*/
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-radius: 18px;
  animation: ${slideUp} 0.55s ease-out;

  .submit-button {
    margin-top: 1rem;
  }

  label {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.fifthly};
  }
`;

const SectionTitle = styled.h3`
  margin-bottom: 1rem;
  animation: ${fadeIn} 0.6s ease-out;

  .user-account,
  .behaviour-emotions,
  .coping-strategies {
    display: inline;
    font-size: 1rem;
    font-weight: 600;
    text-align: left;
    color: ${({ theme }) => theme.colors.text_primary};
  }

  .user-icon,
  .brain-icon{
    width: 1.2rem;
    height: 1.2rem;
    margin-right: 0.5rem;
  }

  .strategy-icon {
    width: 2rem;
    height: 1.7rem;
  }
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.high_risk};
  font-weight: 500;
  animation: ${fadeIn} 0.4s ease-out;
`;

const FooterText = styled.p`
  margin: 2rem 0;
  font-size: 0.9rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text_secondary};
  animation: ${fadeIn} 1s ease-out;

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.fifthly};
    }
  }
`;

/* ---------------- Popup Modal ---------------- */

const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: ${fadeIn} 0.25s ease-out;
`;

const PopupBox = styled.div`
  background: ${({ theme }) => theme.colors.card_bg};
  padding: 2.2rem;
  border-radius: 18px;
  max-width: 420px;
  width: 92%;
  text-align: center;
  box-shadow: 0 10px 32px rgba(0,0,0,0.25);
  animation: ${popupAppear} 0.45s ease-out;
`;

const PopupTitle = styled.h2`
  font-size: 1.45rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

const PopupText = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text_primary};
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

/**--------------------------
    Types for form & payload
---------------------------*/
interface RegisterFormState {
  email: string;
  password: string;
  displayName: string;
  date_of_birth: string;
  age_of_onset: string;
  years_since_onset: string;
  pulling_severity: string;
  pulling_frequency: string;
  pulling_awareness: string;
  successfully_stopped: string;
  how_long_stopped_days: string;
  emotion: string;
  coping_worked: string;     // comma-separated in the input
  coping_not_worked: string; // comma-separated in the input
}

interface RegisterPredictPayload
  extends Omit<RegisterFormState, "coping_worked" | "coping_not_worked"> {
  coping_worked: string[];
  coping_not_worked: string[];
}

/**--------------
    Component
-----------------*/
export const RegisterPredictForm: React.FC = () => {
  const { registerAndPredict, submitting, submitError } = useRegisterAndPredict();

  // Form state
  const [form, setForm] = useState<RegisterFormState>({
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
    coping_worked: "",
    coping_not_worked: "",
  });

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Small helper for parsing comma-separated strategies → string[]
  const parseStrategies = (raw: string): string[] =>
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1️⃣ Parse coping strategies into arrays
    const workedList = parseStrategies(form.coping_worked);
    const notWorkedList = parseStrategies(form.coping_not_worked);

    // 2️⃣ Persist them to localStorage immediately so the dashboard
    //    hook can hydrate from them even before backend knows about them
    try {
      localStorage.setItem("tm_coping_worked", JSON.stringify(workedList));
      localStorage.setItem("tm_coping_not_worked", JSON.stringify(notWorkedList));
    } catch {
      // ignore storage errors
    }

    // 3️⃣ Build payload sent to backend (arrays, not raw strings)
    const payload: RegisterPredictPayload = {
      ...form,
      coping_worked: workedList,
      coping_not_worked: notWorkedList,
    };

    // 4️⃣ Submit registration and prediction
    const success = await registerAndPredict(payload);

    if (success) {
      // Seed sober streak based on how_long_stopped_days + successfully_stopped
      try {
        const rawDays = Number(form.how_long_stopped_days);
        const stoppedDays =
          Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 0;

        const stoppedNow =
          form.successfully_stopped.trim().toLowerCase() === "yes";

        const todayIsoDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        const streak = stoppedNow
          ? {
              // currently on a streak
              currentStreak: stoppedDays,
              previousStreak: 0,
              longestStreak: stoppedDays,
              lastEntryDate: todayIsoDate,
            }
          : {
              // previous streak, currently relapsed
              currentStreak: 0,
              previousStreak: stoppedDays,
              longestStreak: stoppedDays,
              lastEntryDate: todayIsoDate,
            };

        localStorage.setItem("tm_sober_streak", JSON.stringify(streak));
      } catch {
        // ignore storage errors
      }

      // Show success popup
      setShowPopup(true);
    }
  };

  // Close popup and navigate to login
  const closePopup = () => {
    setShowPopup(false);
    navigate("/login");
  };

  return (
    <>
      {/* Popup */}
      {showPopup && (
        <PopupOverlay>
          <PopupBox>
            <PopupTitle>🎉 Welcome to TrichMind!</PopupTitle>
            <PopupText>
              Your account has been created successfully.
              <br />
              <br />
              Please <strong>log in</strong> to view your personalized relapse
              risk prediction and continue your mindful recovery journey.
            </PopupText>

            <ThemeButton onClick={closePopup}>Go to Login</ThemeButton>
          </PopupBox>
        </PopupOverlay>
      )}

      {/* Registration Form */}
      <FormContainer onSubmit={handleSubmit}>
        <SectionTitle>
          <img src={UserIcon} className="user-icon" alt="User Icon" />
          <span className="user-account">ACCOUNT DETAILS</span>
        </SectionTitle>

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

        <FormInput
          name="date_of_birth"
          label="Date of Birth"
          type="date"
          value={form.date_of_birth}
          onChange={handleChange}
          required
        />

        <SectionTitle>
          <img src={BrainIcon} className="brain-icon" alt="Brain Icon" />
          <span className="behaviour-emotions">BEHAVIOR & EMOTIONS</span>
        </SectionTitle>

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
          placeholder="e.g. daily, weekly, several times a week, monthly, rarely"
          value={form.pulling_frequency}
          onChange={handleChange}
          required
        />

        <FormInput
          name="pulling_awareness"
          label="Are you aware while pulling?"
          placeholder="e.g. yes, sometimes, no"
          value={form.pulling_awareness}
          onChange={handleChange}
          required
        />

        <FormInput
          name="successfully_stopped"
          label="Have you successfully stopped?"
          placeholder="e.g. yes, no"
          value={form.successfully_stopped}
          onChange={handleChange}
          required
        />

        <FormInput
          name="how_long_stopped_days"
          label="How long you stopped pulling? (days)"
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

        <SectionTitle>
          <img src={StrategyIcon} className="strategy-icon" alt="Strategy Icon" />
          <span className="coping-strategies">COPING STRATEGIES</span>
        </SectionTitle>
        <FormInput
          name="coping_worked"
          label="Coping strategies that helped you."
          placeholder="e.g. fidget toy, deep breathing, wearing gloves, and etc.,"
          value={form.coping_worked}
          onChange={handleChange}
        />

        <FormInput
          name="coping_not_worked"
          label="Coping strategies that did not help you."
          placeholder="e.g. journaling, stress ball, and etc.,"
          value={form.coping_not_worked}
          onChange={handleChange}
        />

        <ThemeButton className="submit-button" type="submit" disabled={submitting}>
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

