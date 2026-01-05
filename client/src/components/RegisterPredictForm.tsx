// client/src/components/RegisterPredictForm.tsx

"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { ThemeButton, FormInput } from "@/components";
import { useRegisterAndPredict } from "@/hooks";
import { UserIcon, BrainIcon, StrategyIcon } from "@/assets/icons";
import Image from "next/image";


/**-----------------------------------
    Animations
--------------------------------------*/
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const popupAppear = keyframes`
  from { opacity: 0; transform: translateY(22px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/**-----------------------------------
    Layout (mobile-first)
--------------------------------------*/
const Card = styled.div`
  background: ${({ theme }) => theme.colors.card_bg};
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
  animation: ${slideUp} 0.5s ease-out;

  @media (min-width: 768px) {
    padding: 18px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Section = styled.section`
  border-radius: 16px;
  padding: 14px;
  background: ${({ theme }) => theme.colors.card_bg || "rgba(0,0,0,0.02)"};

  @media (min-width: 768px) {
    padding: 16px;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.colors.text_primary};
  text-transform: uppercase;
`;

const IconWrap = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.05);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (min-width: 820px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Full = styled.div`
  grid-column: 1 / -1;
`;

const Hint = styled.p`
  margin: 6px 2px 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text_secondary};
  line-height: 1.35;
`;

/**-----------------------------------
    Chips (quick picks)
--------------------------------------*/
const ChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 2px;
`;

const Chip = styled.button<{ $active?: boolean }>`
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.primary : "rgba(0,0,0,0.12)")};
  background: ${({ $active }) => ($active ? "rgba(0,0,0,0.04)" : "transparent")};
  color: ${({ theme }) => theme.colors.text_primary};
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

/**-----------------------------------
    Sticky mobile CTA (no inline styles)
--------------------------------------*/
const StickyBar = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 5;
  margin-top: 6px;
  padding-top: 10px;

  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    ${({ theme }) => theme.colors.card_bg} 35%
  );

  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));

  @media (min-width: 820px) {
    position: static;
    padding-bottom: 0;
    background: none;
  }
`;

const FullWidthButton = styled(ThemeButton)`
  width: 100%;
`;

const ErrorWrap = styled.div`
  margin-top: 10px;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.high_risk};
  font-weight: 650;
  margin: 0;
  animation: ${fadeIn} 0.35s ease-out;
`;

const FooterText = styled.p`
  margin: 8px 0 0;
  font-size: 0.9rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text_secondary};
  animation: ${fadeIn} 0.6s ease-out;

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.fifthly};
    }
  }
`;

/**-----------------------------------
    Popup
--------------------------------------*/
const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.46);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: ${fadeIn} 0.22s ease-out;
`;

const PopupBox = styled.div`
  background: ${({ theme }) => theme.colors.card_bg};
  padding: 2rem;
  border-radius: 18px;
  max-width: 420px;
  width: 92%;
  text-align: center;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.25);
  animation: ${popupAppear} 0.42s ease-out;
`;

const PopupTitle = styled.h2`
  font-size: 1.35rem;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 0.8rem;
`;

const PopupText = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text_primary};
  margin: 0 0 1.35rem;
  line-height: 1.5;
`;

/**--------------------------------------------
    Password with eye icon
-----------------------------------------------*/
const PasswordField = styled.div`
  position: relative;
  width: 100%;

  input {
    padding-right: 44px !important;
  }
`;

const EyeButton = styled.button`
  position: absolute;
  right: 10px;
  top: 62.50%;
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

function EyeIcon({ off }: { off?: boolean }) {
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
    Interfaces
-----------------------------------------*/
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

interface RegisterPredictPayload extends Omit<RegisterFormState, "coping_worked" | "coping_not_worked"> {
  coping_worked: string[];
  coping_not_worked: string[];
}

/**--------------------------------------
    Helpers
-----------------------------------------*/
function safeNumber(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function computeYearsSinceOnset(dobISO: string, onsetRaw: string): string {
  if (!dobISO) return "";
  const onset = safeNumber(onsetRaw);
  if (onset === null) return "";

  const dob = new Date(dobISO);
  if (Number.isNaN(dob.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;

  return String(Math.max(0, age - onset));
}

const freqQuick = ["Daily", "Several times/week", "Weekly", "Monthly", "Rarely"];
const awarenessQuick = ["Yes", "Sometimes", "No"];
const stoppedQuick = ["Yes", "No"];

/**--------------------------------------
    Component
-----------------------------------------*/
export const RegisterPredictForm: React.FC = () => {
  const { registerAndPredict, submitting, submitError } = useRegisterAndPredict();
  const router = useRouter();

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

  const [showPopup, setShowPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If user manually edits years_since_onset, we stop auto-syncing it
  const [yearsTouched, setYearsTouched] = useState(false);

  const applyAutoYears = (next: RegisterFormState): RegisterFormState => {
    if (yearsTouched) return next;
    const computed = computeYearsSinceOnset(next.date_of_birth, next.age_of_onset);
    // prevent unnecessary state churn:
    if (next.years_since_onset === computed) return next;
    return { ...next, years_since_onset: computed };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "years_since_onset") {
      setYearsTouched(true);
      setForm((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setForm((prev) => applyAutoYears({ ...prev, [name]: value } as RegisterFormState));
  };

  const setQuick = (name: keyof RegisterFormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const parseStrategies = (raw: string): string[] =>
    raw.split(",").map((s) => s.trim()).filter(Boolean);

  const payload: RegisterPredictPayload = useMemo(() => {
    const workedList = parseStrategies(form.coping_worked);
    const notWorkedList = parseStrategies(form.coping_not_worked);

    return {
      ...form,
      coping_worked: workedList,
      coping_not_worked: notWorkedList,
    };
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      localStorage.setItem("tm_coping_worked", JSON.stringify(payload.coping_worked));
      localStorage.setItem("tm_coping_not_worked", JSON.stringify(payload.coping_not_worked));
    } catch {}

    const success = await registerAndPredict(payload);

    if (success) {
      try {
        const rawDays = Number(form.how_long_stopped_days);
        const stoppedDays = Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 0;

        const stoppedNow = form.successfully_stopped.trim().toLowerCase() === "yes";
        const todayIsoDate = new Date().toISOString().slice(0, 10);

        const streak = stoppedNow
          ? { currentStreak: stoppedDays, previousStreak: 0, longestStreak: stoppedDays, lastEntryDate: todayIsoDate }
          : { currentStreak: 0, previousStreak: stoppedDays, longestStreak: stoppedDays, lastEntryDate: todayIsoDate };

        localStorage.setItem("tm_sober_streak", JSON.stringify(streak));
      } catch {}

      setShowPopup(true);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
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

      <Card>
        <Form onSubmit={handleSubmit}>
          {/* ACCOUNT */}
          <Section>
            <SectionHeader>
              <IconWrap>
                <Image src={UserIcon as never} width={18} height={18} alt="User Icon" />
              </IconWrap>
              <SectionTitle>Account</SectionTitle>
            </SectionHeader>

            <Grid>
              <Full>
                <FormInput name="email" label="Email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" />
              </Full>

              <Full>
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
              </Full>

              <FormInput name="displayName" label="Display Name" type="text" value={form.displayName} onChange={handleChange} autoComplete="nickname" />

              <FormInput
                name="date_of_birth"
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
                required
              />
            </Grid>
          </Section>

          {/* BEHAVIOR */}
          <Section>
            <SectionHeader>
              <IconWrap>
                <Image src={BrainIcon as never} width={18} height={18} alt="Brain Icon" />
              </IconWrap>
              <SectionTitle>Behavior & emotions</SectionTitle>
            </SectionHeader>

            <Grid>
              <FormInput name="age_of_onset" label="Age of Onset" type="number" min={0} max={120} value={form.age_of_onset} onChange={handleChange} required inputMode="numeric" />

              <FormInput
                name="years_since_onset"
                label="Years Since Onset"
                type="number"
                min={0}
                max={120}
                value={form.years_since_onset}
                onChange={handleChange}
                required
                inputMode="numeric"
              />

              <Full>
                <Hint>
                  Tip: “Years since onset” is auto-calculated from your birth date + onset age. You can still edit it if you want.
                </Hint>
              </Full>

              <FormInput
                name="pulling_severity"
                label="Pulling Severity (1–10)"
                type="number"
                min={1}
                max={10}
                value={form.pulling_severity}
                onChange={handleChange}
                required
                inputMode="numeric"
              />

              <Full>
                <FormInput
                  name="pulling_frequency"
                  label="How often do you pull?"
                  placeholder="e.g. daily, weekly, monthly"
                  value={form.pulling_frequency}
                  onChange={handleChange}
                  required
                />
                <ChipsRow>
                  {freqQuick.map((x) => (
                    <Chip key={x} type="button" $active={form.pulling_frequency.toLowerCase() === x.toLowerCase()} onClick={() => setQuick("pulling_frequency", x)}>
                      {x}
                    </Chip>
                  ))}
                </ChipsRow>
              </Full>

              <Full>
                <FormInput
                  name="pulling_awareness"
                  label="Are you aware while pulling?"
                  placeholder="e.g. yes, sometimes, no"
                  value={form.pulling_awareness}
                  onChange={handleChange}
                  required
                />
                <ChipsRow>
                  {awarenessQuick.map((x) => (
                    <Chip key={x} type="button" $active={form.pulling_awareness.toLowerCase() === x.toLowerCase()} onClick={() => setQuick("pulling_awareness", x)}>
                      {x}
                    </Chip>
                  ))}
                </ChipsRow>
              </Full>

              <Full>
                <FormInput
                  name="successfully_stopped"
                  label="Have you successfully stopped?"
                  placeholder="e.g. yes, no"
                  value={form.successfully_stopped}
                  onChange={handleChange}
                  required
                />
                <ChipsRow>
                  {stoppedQuick.map((x) => (
                    <Chip key={x} type="button" $active={form.successfully_stopped.toLowerCase() === x.toLowerCase()} onClick={() => setQuick("successfully_stopped", x)}>
                      {x}
                    </Chip>
                  ))}
                </ChipsRow>
              </Full>

              <FormInput
                name="how_long_stopped_days"
                label="How long have you stopped? (days)"
                type="number"
                min={0}
                value={form.how_long_stopped_days}
                onChange={handleChange}
                required
                inputMode="numeric"
              />

              <FormInput
                name="emotion"
                label="Current Emotion"
                placeholder="e.g. anxious, calm, stressed"
                value={form.emotion}
                onChange={handleChange}
                required
              />
            </Grid>
          </Section>

          {/* COPING */}
          <Section>
            <SectionHeader>
              <IconWrap>
                <Image src={StrategyIcon as never} width={20} height={20} alt="Strategy Icon" />
              </IconWrap>
              <SectionTitle>Coping strategies</SectionTitle>
            </SectionHeader>

            <Grid>
              <Full>
                <FormInput
                  name="coping_worked"
                  label="Coping strategies that helped (comma-separated)"
                  placeholder="e.g. fidget toy, deep breathing, wearing gloves"
                  value={form.coping_worked}
                  onChange={handleChange}
                />
              </Full>

              <Full>
                <FormInput
                  name="coping_not_worked"
                  label="Coping strategies that didn’t help (comma-separated)"
                  placeholder="e.g. journaling, stress ball"
                  value={form.coping_not_worked}
                  onChange={handleChange}
                />
              </Full>
            </Grid>
          </Section>

          {/* Sticky CTA */}
          <StickyBar>
            <FullWidthButton type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Register & Predict Relapse Risk"}
            </FullWidthButton>

            {submitError && (
              <ErrorWrap aria-live="polite">
                <ErrorMessage>{submitError}</ErrorMessage>
              </ErrorWrap>
            )}

            <FooterText>
              Already have an account? <Link href="/login?next=/home">Login</Link>
            </FooterText>
          </StickyBar>
        </Form>
      </Card>
    </>
  );
};

export default RegisterPredictForm;
