// client/src/app/(auth)/register/page.tsx

"use client";

import styled, { keyframes } from "styled-components";
import { RegisterPredictForm } from "@/components";
import { AppLogo } from "@/assets/images";


/**-------------------------------------
    Animations and Styled Components
----------------------------------------*/
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const floatUp = keyframes`
    0%   { transform: translateY(18px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
`;

const Shell = styled.main`
    width: 100%;
    min-height: 100dvh;
    display: flex;
    justify-content: center;
    padding: 18px 14px 28px;
    animation: ${fadeIn} 0.5s ease-out;

    /* mobile safe-area friendly */
    padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px));
`;

const Wrap = styled.div`
    width: 100%;
    max-width: 560px;
`;

const LogoRow = styled.div`
    display: flex;
    justify-content: center;
    margin: 18px 0 10px;
    animation: ${floatUp} 0.7s ease-out;
`;

const Logo = styled.img`
    width: 96px;
    height: 104px;
    opacity: 0.95;
    user-select: none;
`;

const Title = styled.h1`
    font-size: 1.55rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.primary};
    text-align: center;
    margin: 6px 0 16px;
    animation: ${floatUp} 0.7s ease-out;
`;

const SubTitle = styled.p`
    text-align: center;
    margin: 0 0 18px;
    color: ${({ theme }) => theme.colors.text_secondary};
    font-size: 0.95rem;
    line-height: 1.45;
`;

export default function RegisterPage() {
    return (
        <Shell>
            <Wrap>
                <LogoRow>
                    <Logo src={AppLogo.src} alt="TrichMind Logo" />
                </LogoRow>

                <Title>Create your account</Title>
                <SubTitle>
                    Quick onboarding — then log in to view your personalized relapse risk prediction.
                </SubTitle>

                <RegisterPredictForm />
            </Wrap>
        </Shell>
    );
}
