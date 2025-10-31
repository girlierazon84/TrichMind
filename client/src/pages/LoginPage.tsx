// client/src/pages/LoginPage.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { authApi } from "../api/authApi";

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** 🧩 Handle input changes */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    /** 🔐 Handle login submission */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await authApi.login(form);

            if (data?.token) {
                // ✅ Save token and user data
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                // ✅ Redirect to dashboard/home
                navigate("/");
            } else {
                setError("Invalid credentials. Please try again.");
            }
        } catch (err: any) {
            console.error("❌ Login failed:", err);
            setError(
                err?.response?.data?.message ||
                "Unable to log in. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <AuthCard>
                <Logo src="/assets/images/app_logo.png" alt="TrichMind Logo" />

                <Title>Welcome Back to TrichMind</Title>
                <Subtitle>Continue your path to mindful recovery 🌱</Subtitle>

                <Form onSubmit={handleSubmit}>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        autoFocus
                    />

                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                    />

                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    <Button type="submit" disabled={loading} $loading={loading}>
                        {loading ? "Signing In..." : "Log In"}
                    </Button>

                    <FooterText>
                        Don’t have an account?{" "}
                        <StyledLink to="/register">Sign Up</StyledLink>
                    </FooterText>

                    <FooterText>
                        <StyledLink to="/forgot-password">Forgot Password?</StyledLink>
                    </FooterText>
                </Form>
            </AuthCard>
        </PageContainer>
    );
}

/* 🌿 Styled Components */

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
    0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
    50% { box-shadow: 0 0 10px 4px rgba(37, 99, 235, 0.25); }
`;

const PageContainer = styled.div`
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%);
    padding: 1rem;
`;

const AuthCard = styled.div`
    background: #ffffff;
    border-radius: 16px;
    padding: 2rem;
    width: 100%;
    max-width: 420px;
    text-align: center;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    animation: ${fadeIn} 0.6s ease-in-out;
`;

const Logo = styled.img`
    width: 90px;
    height: 90px;
    margin: 0 auto 1rem;
`;

const Title = styled.h2`
    font-size: 1.6rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.4rem;
`;

const Subtitle = styled.p`
    font-size: 0.95rem;
    color: #6b7280;
    margin-bottom: 1.4rem;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    text-align: left;
`;

const Label = styled.label`
    font-size: 0.85rem;
    font-weight: 500;
    color: #374151;
    margin-top: 0.7rem;
`;

const Input = styled.input`
    padding: 0.6rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    font-size: 0.9rem;
    margin-top: 0.25rem;
    color: #111827;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
    }
`;

const ErrorMessage = styled.p`
    color: #b91c1c;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 0.5rem;
    font-size: 0.85rem;
    margin-top: 0.8rem;
    text-align: center;
    animation: ${fadeIn} 0.3s ease-in-out;
`;

const Button = styled.button<{ $loading?: boolean }>`
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 0.7rem 1rem;
    margin-top: 1.2rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease, transform 0.15s ease;

    &:hover {
        background-color: #1d4ed8;
        transform: translateY(-1px);
    }

    &:active {
        transform: scale(0.98);
    }

    &:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
    }

    ${({ $loading }) =>
        $loading &&
        css`
        animation: ${pulse} 1.2s infinite;
        `
    }
`;

const FooterText = styled.p`
    text-align: center;
    font-size: 0.85rem;
    margin-top: 0.6rem;
    color: #4b5563;
`;

const StyledLink = styled(Link)`
    color: #2563eb;
    text-decoration: underline;
    &:hover {
        color: #1d4ed8;
    }
`;
