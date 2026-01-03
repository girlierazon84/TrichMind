// client/src/app/(auth)/register/page.tsx

"use client";

import styled, { keyframes } from "styled-components";
import { RegisterPredictForm } from "@/components";
import { AppLogo } from "@/assets/images";


/**-------------------------------------
    Animations and Styled Components
----------------------------------------*/
// Fade-in animation for the entire container
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

// Float-up animation for logo and title
const floatUp = keyframes`
    0%   { transform: translateY(18px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
`;

// Soft pop animation for the card
const softPop = keyframes`
    from { transform: scale(0.95); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
`;

// Registration Container styled component
const RegistrationContainer = styled.main`
    width: 100%;
    display: flex;
    flex-direction: column;
    animation: ${fadeIn} 0.6s ease-out;
`;

// Logo Wrapper styled component
const LogoWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin: 3rem 0 0 0;
    animation: ${floatUp} 0.8s ease-out;
`;

// Logo styled component
const Logo = styled.img`
    width: 110px;
    height: 120px;
    opacity: 0.95;
    user-select: none;
`;

// Page Card styled component
const PageCard = styled.div`
    border-radius: 20px;
    width: 100%;
    animation: ${softPop} 0.5s ease-out;

    @media (max-width: 768px) {
        padding: 1.5rem;
    }
`;

// Title styled component
const Title = styled.h1`
    font-size: 1.9rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    text-align: center;
    margin: 0 0 2.5rem 0;
    animation: ${floatUp} 0.7s ease-out;
`;

/**----------------------------
    Register Page Component
-------------------------------*/
export default function RegisterPage() {
    // Render the registration page with logo, title, and registration form
    return (
        <RegistrationContainer>
            <LogoWrapper>
                <Logo src={AppLogo.src} alt="TrichMind Logo" />
            </LogoWrapper>

            <PageCard>
                <Title>Create Your Account</Title>
                <RegisterPredictForm />
            </PageCard>
        </RegistrationContainer>
    );
}
