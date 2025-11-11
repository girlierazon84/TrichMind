// client/src/pages/RegistrationPage.tsx

import styled from "styled-components";
import RegisterPredictForm from "@/components/RegisterPredictForm";

const RegistrationContainer = styled.main`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.page_bg || "#c9e3e4"};
  color: ${({ theme }) => theme.colors.text_primary};
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
  text-align: center;
`;

export default function RegistrationPage() {
  return (
    <RegistrationContainer>
      <Title title="Create Your TrichMind Account">
        Create Your Account
      </Title>

      {/* 🧠 Accessible: RegisterPredictForm already uses FormInput (with labels) */}
      <RegisterPredictForm />
    </RegistrationContainer>
  );
}
