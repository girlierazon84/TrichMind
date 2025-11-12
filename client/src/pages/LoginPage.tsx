// client/src/pages/LoginPage.tsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth, useLogger } from "@/hooks";
import { ThemeButton, FormInput } from "@/components";
import { GlobalStyle } from "@/styles";


// ──────────────────────────────
// Styled Components
// ──────────────────────────────
const PageContainer = styled.main`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100dvh;
    background: ${({ theme }) => theme.colors.page_bg};
    padding: 2rem;
`;

const Card = styled.div`
    width: 100%;
    max-width: 400px;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    text-align: center;
`;

const Logo = styled.img`
    width: 80px;
    height: 80px;
    object-fit: contain;
    margin-bottom: 1rem;
`;

const Title = styled.h2`
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
    color: ${({ theme }) => theme.colors.text_secondary};
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
`;

const ErrorMessage = styled.p`
    color: ${({ theme }) => theme.colors.high_risk};
    font-size: 0.9rem;
    margin-top: 0.5rem;
`;

const FooterText = styled.p`
    margin-top: 1rem;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text_secondary};

    a {
        color: ${({ theme }) => theme.colors.primary};
        font-weight: 600;
        text-decoration: none;
        transition: color 0.2s ease;

        &:hover {
            color: ${({ theme }) => theme.colors.secondary};
        }
    }
`;

/** Full-width themed submit button (no inline styles) */
const FullWidthButton = styled(ThemeButton)`
    margin-top: 1rem;
    width: 100%;
`;

// ──────────────────────────────
// Types
// ──────────────────────────────
type LoginFormState = {
    email: string;
    password: string;
};

// ──────────────────────────────
// Component
// ──────────────────────────────
export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuth();
    const { log, error: logError } = useLogger(false);

    const [form, setForm] = useState<LoginFormState>({
        email: "",
        password: "",
    });

    const [error, setError] = useState<string | null>(null);

    /** 🧩 Handle input change */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    /** 🔐 Handle login form submission */
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
                navigate("/"); // Redirect to your main page
            } else {
                setError("Invalid credentials. Please try again.");
            }
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : "Login failed. Please try again.";
            setError(msg);
            await logError("Login failed", { email: form.email, error: msg });
        }
    };

    return (
        <>
            <GlobalStyle />
            <PageContainer>
                <Card>
                    <Logo src="/assets/images/app_logo.png" alt="TrichMind Logo" />
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
