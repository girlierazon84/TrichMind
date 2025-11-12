// client/src/routes/AppRoutes.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import { RegistrationPage, LoginPage, HomePage } from "@/pages";
import { BottomNav } from "@/components/BottomNav";
import { PrivateRoute, PublicRoute } from "@/routes";

const Page = styled.main`
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 4rem 1rem;
    background: ${({ theme }) => theme.colors.page_bg};
`;

const Container = styled.div`
    width: 100%;
    max-width: 760px;
    text-align: center;
`;

export const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Page>
                <Container>
                    <Routes>
                        {/* HOME PAGE */}
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <HomePage />
                                </PrivateRoute>
                            }
                        />

                        {/* LOGIN */}
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <LoginPage />
                                </PublicRoute>
                            }
                        />

                        {/* REGISTER */}
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <RegistrationPage />
                                </PublicRoute>
                            }
                        />

                        {/* FALLBACK */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Container>
            </Page>

            {isAuthenticated && <BottomNav />}
        </>
    );
};
