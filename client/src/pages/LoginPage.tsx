// client/src/pages/LoginPage.tsx

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useLogger } from "@/hooks";
import { ThemeButton, FormInput } from "@/components";
import { GlobalStyle } from "@/styles";
import { AppLogo } from "@/assets/images";


/* -----------------------------------------------------
    Premium Calm Animations
----------------------------------------------------- */

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const smoothRise = keyframes`
    from { opacity: 0; transform: translateY(30px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/* -----------------------------------------------------
    Styled Components
----------------------------------------------------- */

const PageWrapper = styled.main`
    margin: -50px 0;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    animation: ${fadeIn} 0.5s ease-out;
`;

const PremiumCard = styled.div<{ $visible: boolean }>`
    width: 100%;
    max-width: 420px;
    border-radius: 20px;
    padding: 2.4rem 2rem;
    animation: ${smoothRise} 0.7s ease-out;
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    transform: ${({ $visible }) =>
        $visible ? "translateY(0)" : "translateY(25px)"};
    transition: opacity 0.5s ease, transform 0.5s ease;
`;

const Logo = styled.img`
    width: 95px;
    height: auto;
    margin: 1rem auto;
    display: block;
`;

const Title = styled.h1`
    font-size: 1.75rem;
    text-align: center;
    color: ${({ theme }) => theme.colors.primary};
    margin: -25px 0 -15px 0;
`;

const Subtitle = styled.p`
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    text-align: center;
    margin-bottom: 2rem;
`;

const ErrorMessage = styled.p`
    font-size: 0.85rem;
    margin-top: 0.5rem;
    color: ${({ theme }) => theme.colors.high_risk};
`;

const FooterText = styled.p`
    text-align: center;
    margin: 2rem 0 -30px 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text_secondary};

    a {
        color: ${({ theme }) => theme.colors.primary};
        font-weight: 600;
    }
`;

const ButtonWrapper = styled.div`
    margin-top: 3rem;
`;

/* -----------------------------------------------------
    Component
----------------------------------------------------- */

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { user, login, loading } = useAuth();
    const { log, error: logError } = useLogger();

    const [cardVisible, setCardVisible] = useState(false);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

    /* Animate card entrance */
    useEffect(() => {
        const t = setTimeout(() => setCardVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    /* Auto redirect if already logged in */
    useEffect(() => {
        if (user) {
            navigate(redirectTo, { replace: true });
        }
    }, [user, navigate, redirectTo]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        try {
            // login(email, password) must match your hook signature
            const result = await login({ email: email.trim(), password });

            if (result?.token) {
                await log("User logged in", { email });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Login failed.";
            setError(msg);
            await logError("Login failed", { email, error: msg });
        }
    };

    return (
        <>
            <GlobalStyle />
            <PageWrapper>
                <PremiumCard $visible={cardVisible}>
                    <Logo src={AppLogo} alt="TrichMind Logo" />

                    <Title>Welcome Back</Title>
                    <Subtitle>Your calm recovery journey continues here 🌱</Subtitle>

                    <form onSubmit={handleSubmit}>
                        <FormInput
                            label="Email"
                            type="email"
                            name="email"
                            value={email}
                            autoComplete="email"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                        <FormInput
                            label="Password"
                            type="password"
                            name="password"
                            value={password}
                            autoComplete="current-password"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                        {error && <ErrorMessage>{error}</ErrorMessage>}

                        <ButtonWrapper>
                            <ThemeButton type="submit" disabled={loading}>
                                {loading ? "Signing in…" : "Log In"}
                            </ThemeButton>
                        </ButtonWrapper>

                        <FooterText>
                            Don’t have an account? <Link to="/register">Sign up</Link>
                        </FooterText>
                    </form>
                </PremiumCard>
            </PageWrapper>
        </>
    );
};

export default LoginPage;
