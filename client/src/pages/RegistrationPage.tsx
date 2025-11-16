// client/src/pages/RegistrationPage.tsx

import styled, { keyframes } from "styled-components";
import { RegisterPredictForm } from "@/components";
import { AppLogo } from "@/assets/images";

/* -----------------------------------------------------
    PREMIUM ANIMATIONS
----------------------------------------------------- */

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const floatUp = keyframes`
  0%   { transform: translateY(18px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const softPop = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
`;

/* -----------------------------------------------------
    Styled Components
----------------------------------------------------- */

const RegistrationContainer = styled.main`
  min-height: 100vh;
  width: 100%;
  margin: -50px 0;
  display: flex;
  border-radius: 25px;
  border: 1px solid ${({ theme }) => theme.colors.card_bg};
  box-shadow: 2px 4px 30px rgba(3, 79, 79, 0.5);
  flex-direction: column;
  animation: ${fadeIn} 0.6s ease-out;
`;

const LogoWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 3rem 0 0 0;
  animation: ${floatUp} 0.8s ease-out;
`;

const Logo = styled.img`
  width: 110px;
  height: 120px;
  opacity: 0.95;
  user-select: none;
`;

const PageCard = styled.div`
  border-radius: 20px;
  width: 100%;
  animation: ${softPop} 0.5s ease-out;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 1.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  margin: 0 0 2.5rem 0;
  animation: ${floatUp} 0.7s ease-out;
`;

/* -----------------------------------------------------
    Component
----------------------------------------------------- */

export const RegistrationPage: React.FC = () => {
  return (
    <RegistrationContainer>
      <LogoWrapper>
        <Logo src={ AppLogo } alt="TrichMind Logo" />
      </LogoWrapper>

      <PageCard>
        <Title>Create Your Account</Title>
        <RegisterPredictForm />
      </PageCard>
    </RegistrationContainer>
  );
};

export default RegistrationPage;
