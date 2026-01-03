// client/src/app/(auth)/login/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useLogger } from "@/hooks";
import { ThemeButton, FormInput } from "@/components";
import { GlobalStyle } from "@/styles";
import { AppLogo } from "@/assets/images";


/**-------------------------------------
    Animations and Styled Components
----------------------------------------*/
// Fade-in animation for the page
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

// Smooth rise animation for the card
const smoothRise = keyframes`
    from { opacity: 0; transform: translateY(30px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// Page wrapper styling
const PageWrapper = styled.main`
    margin: -50px 0;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    animation: ${fadeIn} 0.5s ease-out;
`;

// Premium card styling
const PremiumCard = styled.div<{ $visible: boolean }>`
    width: 100%;
    max-width: 420px;
    border-radius: 20px;
    padding: 2.4rem 2rem;
    animation: ${smoothRise} 0.7s ease-out;
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    transform: ${({ $visible }) => ($visible ? "translateY(0)" : "translateY(25px)")};
    transition: opacity 0.5s ease, transform 0.5s ease;
`;

// Logo styling
const Logo = styled.img`
    width: 95px;
    height: auto;
    margin: 1rem auto;
    display: block;
`;

// Title styling
const Title = styled.h1`
    font-size: 1.75rem;
    text-align: center;
    color: ${({ theme }) => theme.colors.primary};
    margin: -25px 0 -15px 0;
`;

// Subtitle styling
const Subtitle = styled.p`
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.text_secondary};
    text-align: center;
    margin-bottom: 2rem;
`;

// Error message styling
const ErrorMessage = styled.p`
    font-size: 0.85rem;
    margin-top: 0.5rem;
    color: ${({ theme }) => theme.colors.high_risk};
`;

// Footer text styling
const FooterText = styled.p`
    text-align: center;
    margin: 2rem 0 -30px 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text_secondary};

    a {
        color: ${({ theme }) => theme.colors.primary};
        font-weight: 600;
        text-decoration: none;
        transition: color 0.2s ease;

        &:hover {
            color: ${({ theme }) => theme.colors.fifthly};
        }
    }
`;

// Button wrapper styling
const ButtonWrapper = styled.div`
    margin-top: 3rem;
`;

// Password input wrapper + eye button styling
const PasswordField = styled.div`
    position: relative;
    width: 100%;

    input {
        padding-right: 44px !important;
    }
`;

// Eye button styling
const EyeButton = styled.button`
    position: absolute;
    right: 10px;
    top: 65%;
    transform: translateY(-50%);
    height: 32px;
    width: 32px;
    border: none;
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
    display: grid;
    place-items: center;
    color: ${({ theme }) => theme.colors.text_secondary};

    &:hover {
        background: rgba(0, 0, 0, 0.05);
        color: ${({ theme }) => theme.colors.text_primary};
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.primary};
        outline-offset: 2px;
    }
`;

/**----------------------------------------------------------
    Eye Icon Component - toggles between show/hide states
-------------------------------------------------------------*/
function EyeIcon({ off }: { off?: boolean }) {
    // Eye off (hidden) icon
    return off ? (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a21.77 21.77 0 0 1 5.06-6.94" />
            <path d="M1 1l22 22" />
            <path d="M9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
            <path d="M14.12 14.12A3 3 0 0 0 9.88 9.88" />
            <path d="M14.12 14.12A3 3 0 0 0 9.88 9.88" />
            <path d="M6.23 6.23A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a21.77 21.77 0 0 1-3.18 4.34" />
        </svg>
    ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

/**-------------------------
    Login Page Component
----------------------------*/
export default function LoginPage() {
    // Next.js router and search params
    const router = useRouter();
    const searchParams = useSearchParams();

    // Auth and logger hooks
    const { user, login, loading } = useAuth();
    const { log, error: logError } = useLogger();

    // Component state
    const [cardVisible, setCardVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Use `next` (not `from`) and default to /home
    const redirectTo = searchParams.get("next") ?? "/home";

    // Animate card visibility on mount
    useEffect(() => {
        // Slight delay for smooth animation
        const t = setTimeout(() => setCardVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        // If user exists, redirect to the specified page
        if (user) router.replace(redirectTo);
    }, [user, router, redirectTo]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // Prevent default form submission
        e.preventDefault();
        setError(null);

        // Attempt to log in
        try {
            // Call login function from useAuth
            const result = await login({ email: email.trim(), password });

            // ✅ If your login returns token, redirect right away.
            // If your useAuth sets user later, the useEffect above will handle it.
            if (result?.token) {
                // Log the successful login
                await log("User logged in", { email });
                router.replace(redirectTo);
            }
        } catch (err) {
            // Handle and log errors
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
                    <Logo src={AppLogo.src} alt="TrichMind Logo" />

                    <Title>Welcome Back</Title>
                    <Subtitle>Your calm recovery journey continues here 🌱</Subtitle>

                    <form onSubmit={handleSubmit}>
                        <FormInput
                            label="Email"
                            type="email"
                            name="email"
                            value={email}
                            autoComplete="email"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            required
                        />

                        {/* ✅ Password with show/hide */}
                        <PasswordField>
                            <FormInput
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={password}
                                autoComplete="current-password"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                required
                            />
                            <EyeButton
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                <EyeIcon off={showPassword} />
                            </EyeButton>
                        </PasswordField>

                        {error && <ErrorMessage>{error}</ErrorMessage>}

                        <ButtonWrapper>
                            <ThemeButton type="submit" disabled={loading}>
                                {loading ? "Signing in…" : "Log In"}
                            </ThemeButton>
                        </ButtonWrapper>

                        <FooterText>
                            Don’t have an account? <Link href="/register">Sign up</Link>
                        </FooterText>
                    </form>
                </PremiumCard>
            </PageWrapper>
        </>
    );
}
