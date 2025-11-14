// client/src/pages/RegistrationPage.tsx

import styled from "styled-components";
import { RegisterPredictForm } from "@/components";
import AppLogo from "@/assets/images/app_logo.png";


const RegistrationContainer = styled.main`
  padding: 2rem;
  background: ${({ theme }) => theme.colors.page_bg || "#c9e3e4"};
  color: ${({ theme }) => theme.colors.text_primary};
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 1.5rem 0;
  text-align: center;
`;

const Logo = styled.img`
    width: 100px;
    height: 110px;
    object-fit: contain;
    margin-bottom: 0;
`;

export const RegistrationPage: React.FC = () => {
  return (
    <RegistrationContainer>
      <Logo src={ AppLogo } alt="TrichMind Logo" />
      <Title>Create Your Account</Title>
      <RegisterPredictForm />
    </RegistrationContainer>
  );
};

export default RegistrationPage;
