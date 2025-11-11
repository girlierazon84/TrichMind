// client/src/pages/RegistrationPage.tsx

import styled from "styled-components";
import { RegisterPredictForm } from "@/components/RegisterPredictForm";

const RegistrationContainer = styled.main`
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

export const RegistrationPage: React.FC = () => {
  return (
    <RegistrationContainer>
      <Title>Create Your Account</Title>
      <RegisterPredictForm />
    </RegistrationContainer>
  );
}
