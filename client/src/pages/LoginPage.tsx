// client/src/pages/LoginPage.tsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { fadeIn, scaleIn } from "@/styles/animations";
import { useAuth, useLogger } from "@/hooks";
import { ThemeButton, FormInput } from "@/components";
import { GlobalStyle } from "@/styles";
import { AppLogo } from "@/assets/images";

/* ---------------------------------------------------------
   Calm Fade Out Animation for Smooth Redirect
--------------------------------------------------------- */
const fadeOut = `
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.35s ease-out, transform 0.35s ease-out;
`;

const PageContainer = styled.main<{ fading?: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100dvh;
    background: ${({ theme }) => theme.colors.page_bg};
    padding: 2rem;
    animation: ${fadeIn} 0.6s ease-out;

    ${({ fading }) => fading && fadeOut}
`;

const Card = styled.div`
    width: 100%;
    max-width: 400px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    text-align: center;
    animation: ${scaleIn} 0.45s ease-out;
`;

const Logo = styled.img`
    width: 100px;
    height: 110px;
    object-fit: contain;
    margin-bottom: 0.5rem;
    animation: ${fadeIn} 0.7s ease-out;
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
    animation: ${fadeIn} 0.4s ease-out;
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
    animation: ${scaleIn} 0.6s ease-out;
`;

type LoginFormState = { email: string; password: string };

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, loading, isAuthenticated } = useAuth();
    const { log, error: logError } = useLogger(false);

    const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [fading, setFading] = useState(false);

    /* ---------------------------------------------------------
       FIX: Correct authenticated redirect using useEffect
    --------------------------------------------------------- */
    useEffect(() => {
        if (isAuthenticated) {
            setFading(true);
            const timer = setTimeout(() => navigate("/"), 350);
            return () => clearTimeout(timer);
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

                setFading(true);
                setTimeout(() => navigate("/"), 350); // Smooth exit
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
            <PageContainer fading={fading}>
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
