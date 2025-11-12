// client/src/routes/AppRoutes.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import { RegistrationPage } from "@/pages/RegistrationPage";
import LoginPage from "@/pages/LoginPage";
import { BottomNav } from "@/components/BottomNav";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { PublicRoute } from "@/routes/PublicRoute";

// ──────────────────────────────
// Styled Components
// ──────────────────────────────
const Page = styled.main`
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 4rem 1rem;
    background: ${({ theme }) => theme.colors.page_bg || "#c9e3e4"};
`;

const Container = styled.div`
    width: 100%;
    max-width: 760px;
    text-align: center;
`;

const WelcomeMessage = styled.h2`
    color: ${({ theme }) => theme.colors.text_primary};
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 2rem;
`;

// ──────────────────────────────
// Routes Component
// ──────────────────────────────
export const AppRoutes = () => {
    const { user, isAuthenticated } = useAuth();

    return (
        <BrowserRouter>
            <Page>
                <Container>
                    <Routes>
                        {/* 🏠 Protected Home Route */}
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <WelcomeMessage>
                                        Welcome back, {user?.displayName || user?.email}! 🎉
                                    </WelcomeMessage>
                                </PrivateRoute>
                            }
                        />

                        {/* 🔐 Login Page (Public) */}
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <LoginPage />
                                </PublicRoute>
                            }
                        />

                        {/* 📝 Registration Page (Public) */}
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <RegistrationPage />
                                </PublicRoute>
                            }
                        />

                        {/* 🧭 Catch-all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Container>
            </Page>

            {/* 🧭 Bottom Navigation visible only when authenticated */}
            {isAuthenticated && <BottomNav />}
        </BrowserRouter>
    );
};
