// client/src/components/RegisterPredictForm.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { ThemeButton, FormInput } from "@/components";
import { useRegisterAndPredict } from "@/hooks";
import { UserIcon, BrainIcon, StrategyIcon } from "@/assets/icons";
import Image from "next/image";


/**-----------------------------------
    Styled Components & Animations
--------------------------------------*/
// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Slide-up animation for form
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Popup appear animation
const popupAppear = keyframes`
  from { opacity: 0; transform: translateY(30px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// Form container styling
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

// Section title styling
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

// Error message styling
const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.high_risk};
  font-weight: 500;
  animation: ${fadeIn} 0.4s ease-out;
`;

// Footer text styling
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

// Popup overlay and box styling
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

// Popup box styling
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

// Popup title styling
const PopupTitle = styled.h2`
  font-size: 1.45rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
`;

// Popup text styling
const PopupText = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text_primary};
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

// Password input wrapper + eye button styling
const PasswordField = styled.div`
  position: relative;
  width: 100%;

  /* Make room for the eye button inside the input */
  input {
    padding-right: 44px !important;
  }
`;

// Eye button styling
const EyeButton = styled.button`
  position: absolute;
  right: 10px;
  top: 55%;
  transform: translateY(-50%);
  height: 32px;
  width: 32px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.text_secondary};

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: ${({ theme }) => theme.colors.text_primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

/**--------------------------------------------
    Minimal inline eye icon (no extra deps)
-----------------------------------------------*/
function EyeIcon({ off }: { off?: boolean }) {
  // Simple eye icon SVGs
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a21.77 21.77 0 0 1 5.06-6.94" />
      <path d="M1 1l22 22" />
      <path d="M9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
      <path d="M14.12 14.12A3 3 0 0 0 9.88 9.88" />
      <path d="M6.23 6.23A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a21.77 21.77 0 0 1-3.18 4.34" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**--------------------------------------
    Interfaces & Component Definition
-----------------------------------------*/
// Form state interface
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
  coping_worked: string;
  coping_not_worked: string;
}

// Payload interface for register and predict
interface RegisterPredictPayload
  extends Omit<RegisterFormState, "coping_worked" | "coping_not_worked"> {
  coping_worked: string[];
  coping_not_worked: string[];
}

/**--------------------------------------
    Register & Predict Form Component
-----------------------------------------*/
export const RegisterPredictForm: React.FC = () => {
  // Hooks
  const { registerAndPredict, submitting, submitError } = useRegisterAndPredict();
  const router = useRouter();

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
  const [showPassword, setShowPassword] = useState(false);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update form state
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Parse coping strategies from comma-separated string
  const parseStrategies = (raw: string): string[] =>
    raw.split(",").map((s) => s.trim()).filter(Boolean);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission
    e.preventDefault();

    // Prepare payload
    const workedList = parseStrategies(form.coping_worked);
    const notWorkedList = parseStrategies(form.coping_not_worked);

    // Save coping strategies to localStorage
    try {
      // Save to localStorage for future pre-filling
      localStorage.setItem("tm_coping_worked", JSON.stringify(workedList));
      localStorage.setItem("tm_coping_not_worked", JSON.stringify(notWorkedList));
    } catch {}

    // Create payload
    const payload: RegisterPredictPayload = {
      ...form,
      coping_worked: workedList,
      coping_not_worked: notWorkedList,
    };

    // Call register and predict
    const success = await registerAndPredict(payload);

    // If registration successful, handle streak and show popup
    if (success) {
      // Handle sober streak in localStorage
      try {
        // Determine streak based on form data
        const rawDays = Number(form.how_long_stopped_days);
        const stoppedDays = Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 0;

        // Update streak in localStorage
        const stoppedNow = form.successfully_stopped.trim().toLowerCase() === "yes";
        const todayIsoDate = new Date().toISOString().slice(0, 10);

        // Set streak object
        const streak = stoppedNow
          ? { currentStreak: stoppedDays, previousStreak: 0, longestStreak: stoppedDays, lastEntryDate: todayIsoDate }
          : { currentStreak: 0, previousStreak: stoppedDays, longestStreak: stoppedDays, lastEntryDate: todayIsoDate };

        // Save streak to localStorage
        localStorage.setItem("tm_sober_streak", JSON.stringify(streak));
      } catch {}

      // Show success popup
      setShowPopup(true);
    }
  };

  // Close popup and redirect to login
  const closePopup = () => {
    // Hide popup
    setShowPopup(false);
    // ✅ Send to login with next=/home so after login user lands on home
    router.replace("/login?next=/home");
  };

  return (
    <>
      {showPopup && (
        <PopupOverlay>
          <PopupBox>
            <PopupTitle>🎉 Welcome to TrichMind!</PopupTitle>
            <PopupText>
              Your account has been created successfully.
              <br />
              <br />
              Please <strong>log in</strong> to view your personalized relapse risk prediction and continue your mindful recovery journey.
            </PopupText>

            <ThemeButton onClick={closePopup}>Go to Login</ThemeButton>
          </PopupBox>
        </PopupOverlay>
      )}

      <FormContainer onSubmit={handleSubmit}>
        <SectionTitle>
          <Image src={UserIcon as never} className="user-icon" alt="User Icon" />
          <span className="user-account">ACCOUNT DETAILS</span>
        </SectionTitle>

        <FormInput name="email" label="Email" type="email" value={form.email} onChange={handleChange} required />

        {/* ✅ Password with show/hide */}
        <PasswordField>
          <FormInput
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          <EyeButton
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            <EyeIcon off={showPassword} />
          </EyeButton>
        </PasswordField>

        <FormInput name="displayName" label="Display Name" type="text" value={form.displayName} onChange={handleChange} />
        <FormInput name="date_of_birth" label="Date of Birth" type="date" value={form.date_of_birth} onChange={handleChange} required />

        <SectionTitle>
          <Image src={BrainIcon as never} className="brain-icon" alt="Brain Icon" />
          <span className="behaviour-emotions">BEHAVIOR & EMOTIONS</span>
        </SectionTitle>

        <FormInput name="age_of_onset" label="Age of Onset" type="number" min={0} max={120} value={form.age_of_onset} onChange={handleChange} required />
        <FormInput name="years_since_onset" label="Years Since Onset" type="number" min={0} max={120} value={form.years_since_onset} onChange={handleChange} required />
        <FormInput name="pulling_severity" label="Pulling Severity (1–10)" type="number" min={1} max={10} value={form.pulling_severity} onChange={handleChange} required />

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
          <Image src={StrategyIcon as never} className="strategy-icon" alt="Strategy Icon" />
          <span className="coping-strategies">COPING STRATEGIES</span>
        </SectionTitle>

        <FormInput
          name="coping_worked"
          label="Coping strategies that helped you."
          placeholder="e.g. fidget toy, deep breathing, wearing gloves"
          value={form.coping_worked}
          onChange={handleChange}
        />

        <FormInput
          name="coping_not_worked"
          label="Coping strategies that did not help you."
          placeholder="e.g. journaling, stress ball"
          value={form.coping_not_worked}
          onChange={handleChange}
        />

        <ThemeButton className="submit-button" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Register & Predict Relapse Risk"}
        </ThemeButton>

        {submitError && <ErrorMessage>{submitError}</ErrorMessage>}

        <FooterText>
          Already have an account? <Link href="/login?next=/home">Login</Link>
        </FooterText>
      </FormContainer>
    </>
  );
};

export default RegisterPredictForm;
