// client/src/app/(auth)/login/LoginClient.tsx

"use client";

import React, { useEffect, useId, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useLogger } from "@/hooks";
import { ThemeButton, FormInput } from "@/components";
import { GlobalStyle } from "@/styles";
import { AppLogo } from "@/assets/images";


/**---------------
    Animations
------------------*/
const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

const rise = keyframes`
    from { opacity: 0; transform: translateY(14px) scale(0.99); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/**------------------------
    Mobile-first layout
---------------------------*/
const Shell = styled.main`
    min-height: 100dvh;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 18px 14px 28px;
    animation: ${fadeIn} 0.5s ease-out;

    /* mobile safe-area friendly */
    padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px));

    @media (min-width: 768px) {
        align-items: center;
        padding: 32px 18px;
    }
`;

const Wrap = styled.div`
    width: 100%;
    max-width: 520px;
`;

const Card = styled.section<{ $visible: boolean }>`
    width: 100%;
    background: ${({ theme }) => theme.colors.card_bg};
    border-radius: 22px;
    padding: 16px 14px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: ${({ theme }) => theme.colors.card_shadow};
    animation: ${rise} 0.55s ease-out;
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    transform: ${({ $visible }) => ($visible ? "translateY(0)" : "translateY(10px)")};
    transition: opacity 0.35s ease, transform 0.35s ease;

    @media (min-width: 768px) {
        padding: 20px 18px;
    }
`;

const Top = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
`;

const Logo = styled.img`
    width: 92px;
    height: 100px;
    user-select: none;
    opacity: 0.96;
`;

const Title = styled.h1`
    margin: 0;
    font-size: 1.45rem;
    font-weight: 900;
    text-align: center;
    color: ${({ theme }) => theme.colors.primary};

    @media (min-width: 768px) {
        font-size: 1.6rem;
    }
`;

const Subtitle = styled.p`
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.45;
    text-align: center;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
`;

const ErrorBox = styled.div`
    border-radius: 14px;
    padding: 10px 12px;
    background: rgba(255, 80, 80, 0.08);
    border: 1px solid rgba(255, 80, 80, 0.22);
    color: ${({ theme }) => theme.colors.high_risk};
    font-size: 0.9rem;
    font-weight: 700;
`;

const StickyBar = styled.div`
    position: sticky;
    bottom: 0;
    z-index: 5;
    margin-top: 10px;
    padding-top: 10px;

    background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0),
        ${({ theme }) => theme.colors.card_bg} 35%
    );
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));

    @media (min-width: 820px) {
        position: static;
        padding-bottom: 0;
        background: none;
    }
`;

const FullWidthButton = styled(ThemeButton)`
    width: 100%;
`;

const FooterText = styled.p`
    margin: 10px 0 0;
    font-size: 0.9rem;
    text-align: center;
    color: ${({ theme }) => theme.colors.text_secondary};

    a {
        color: ${({ theme }) => theme.colors.primary};
        font-weight: 800;
        text-decoration: none;

        &:hover {
            color: ${({ theme }) => theme.colors.fifthly};
        }
    }
`;

/**-------------------
    Password field
----------------------*/
const PasswordField = styled.div`
    position: relative;
    width: 100%;

    input {
        padding-right: 44px !important;
    }
`;

const EyeButton = styled.button`
    position: absolute;
    right: 10px;
    top: 55%;
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

function EyeIcon({ off }: { off?: boolean }) {
    return off ? (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a21.77 21.77 0 0 1 5.06-6.94" />
            <path d="M1 1l22 22" />
            <path d="M9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
            <path d="M14.12 14.12A3 3 0 0 0 9.88 9.88" />
            <path d="M6.23 6.23A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a21.77 21.77 0 0 1-3.18 4.34" />
        </svg>
    ) : (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

type Props = {
    redirectTo: string;
};

export default function LoginClient({ redirectTo }: Props) {
    const router = useRouter();

    const { user, login, loading } = useAuth();
    const { log, error: logError } = useLogger();

    const [cardVisible, setCardVisible] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const errorId = useId();

    useEffect(() => {
        const t = window.setTimeout(() => setCardVisible(true), 50);
        return () => window.clearTimeout(t);
    }, []);

    useEffect(() => {
        if (user) router.replace(redirectTo);
    }, [user, router, redirectTo]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const cleanEmail = email.trim();

        try {
            const result = await login({ email: cleanEmail, password });
            if (result?.token) {
                await log("User logged in", { email: cleanEmail });
                router.replace(redirectTo);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Login failed.";
            setError(msg);
            await logError("Login failed", { email: cleanEmail, error: msg });
        }
    };

    return (
        <>
            <GlobalStyle />

            <Shell>
                <Wrap>
                    <Card $visible={cardVisible} aria-label="Login">
                        <Top>
                            <Logo src={AppLogo.src} alt="TrichMind Logo" />
                            <Title>Welcome back</Title>
                            <Subtitle>Your calm recovery journey continues here 🌱</Subtitle>
                        </Top>

                        <Form onSubmit={handleSubmit}>
                            <FormInput
                                label="Email"
                                type="email"
                                name="email"
                                value={email}
                                autoComplete="email"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                required
                            />

                            <PasswordField>
                                <FormInput
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={password}
                                    autoComplete="current-password"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    required
                                    aria-describedby={error ? errorId : undefined}
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

                            {error && (
                                <ErrorBox role="alert" id={errorId}>
                                    {error}
                                </ErrorBox>
                            )}

                            <StickyBar>
                                <FullWidthButton type="submit" disabled={loading}>
                                    {loading ? "Signing in…" : "Log in"}
                                </FullWidthButton>

                                <FooterText>
                                    Don’t have an account? <Link href="/register">Sign up</Link>
                                </FooterText>
                            </StickyBar>
                        </Form>
                    </Card>
                </Wrap>
            </Shell>
        </>
    );
}
