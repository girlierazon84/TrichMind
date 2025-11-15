// client/src/pages/LoginPage.tsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { fadeIn, scaleIn } from "@/styles/animations";
import { useAuth, useLogger } from "@/hooks";
import { ThemeButton, FormInput } from "@/components";
import { GlobalStyle } from "@/styles";
import { AppLogo } from "@/assets/images";

/* ---------------------------------------------------------
   PREMIUM TRANSITION ANIMATIONS
--------------------------------------------------------- */

const fadeOut = keyframes`
    from { opacity: 1; transform: translateY(0); filter: blur(0px); }
    to   { opacity: 0; transform: translateY(10px); filter: blur(8px); }
`;

const overlayFadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const breathingCircle = keyframes`
    0%   { transform: scale(0.65); opacity: 0.2; }
    45%  { transform: scale(1); opacity: 0.35; }
    100% { transform: scale(0.65); opacity: 0.2; }
`;

/* ---------------------------------------------------------
   Styled Components
--------------------------------------------------------- */

const PageContainer = styled.main<{ exiting?: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100dvh;
    background: ${({ theme }) => theme.colors.page_bg};
    padding: 2rem;

    animation: ${fadeIn} 0.5s ease-out;

    ${({ exiting }) =>
        exiting &&
        css`
            animation: ${fadeOut} 0.45s ease-out forwards;
        `}
`;

const Card = styled.div`
    width: 100%;
    max-width: 400px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    text-align: center;
    animation: ${scaleIn} 0.4s ease-out;
`;

const Logo = styled.img`
    width: 100px;
    height: 110px;
    object-fit: contain;
    margin-bottom: 0.5rem;
    animation: ${fadeIn} 0.6s ease-out;
`;

const Title = styled.h2`
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.55rem;
    font-weight: 700;
    margin: 0;
    animation: ${fadeIn} 0.75s ease-out;
`;

const Subtitle = styled.p`
    color: ${({ theme }) => theme.colors.text_secondary};
    font-size: 0.95rem;
    margin-bottom: 2rem;
    animation: ${fadeIn} 0.85s ease-out;
`;

const ErrorMessage = styled.p`
    color: ${({ theme }) => theme.colors.high_risk};
    font-size: 0.9rem;
    margin-top: 0.5rem;
    animation: ${fadeIn} 0.35s ease-out;
`;

const FooterText = styled.p`
    margin-top: 1rem;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    animation: ${fadeIn} 1s ease-out;

    a {
        color: ${({ theme }) => theme.colors.primary};
        font-weight: 600;
        text-decoration: none;
        transition: color 0.2s ease;

        &:hover { color: ${({ theme }) => theme.colors.secondary}; }
    }
`;

const FullWidthButton = styled(ThemeButton)`
    margin-top: 1rem;
    width: 100%;
`;

const TransitionOverlay = styled.div<{ show: boolean }>`
    position: fixed;
    inset: 0;
    background: ${({ theme }) => theme.colors.page_bg}dd;
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    align-items: center;

    pointer-events: none;
    opacity: 0;

    ${({ show }) =>
        show &&
        css`
            opacity: 1;
            animation: ${overlayFadeIn} 0.35s ease-out forwards;
        `}
`;

const BreathingCircle = styled.div<{ show: boolean }>`
    width: 120px;
    height: 120px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.primary}33;
    opacity: 0;

    ${({ show }) =>
        show &&
        css`
            animation: ${breathingCircle} 2.8s ease-in-out infinite;
            opacity: 1;
        `}
`;

/* ---------------------------------------------------------
   Component
--------------------------------------------------------- */

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, loading, isAuthenticated } = useAuth();
    const { log, error: logError } = useLogger(false);

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [exiting, setExiting] = useState(false);
    const [playTransition, setPlayTransition] = useState(false);

    /* Redirect if already authenticated */
    useEffect(() => {
        if (isAuthenticated) {
            setPlayTransition(true);
            setExiting(true);

            setTimeout(() => navigate("/"), 1450);
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await login({
                email: form.email.trim(),
                password: form.password,
            });

            if (res?.token) {
                await log("User logged in", { email: form.email });

                // Play premium transition
                setPlayTransition(true);
                setExiting(true);

                // Navigate after calm animation
                setTimeout(() => navigate("/"), 1450);
            } else {
                setError("Invalid credentials.");
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Login failed.";
            setError(msg);
            await logError("Login failed", { email: form.email, error: msg });
        }
    };

    return (
        <>
            <GlobalStyle />

            {/* Premium Transition Overlay */}
            <TransitionOverlay show={playTransition}>
                <BreathingCircle show={playTransition} />
            </TransitionOverlay>

            <PageContainer exiting={exiting}>
                <Card>
                    <Logo src={AppLogo} alt="TrichMind Logo" />
                    <Title>Welcome Back to TrichMind</Title>
                    <Subtitle>Continue your path to mindful recovery 🌱</Subtitle>

                    <form onSubmit={handleSubmit}>
                        <FormInput
                            label="Email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />

                        <FormInput
                            label="Password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />

                        {error && <ErrorMessage>{error}</ErrorMessage>}

                        <FullWidthButton type="submit" disabled={loading}>
                            {loading ? "Signing In..." : "Log In"}
                        </FullWidthButton>

                        <FooterText>
                            Don’t have an account? <Link to="/register">Sign Up</Link>
                        </FooterText>

                        <FooterText>
                            <Link to="/forgot-password">Forgot Password?</Link>
                        </FooterText>
                    </form>
                </Card>
            </PageContainer>
        </>
    );
};

export default LoginPage;
