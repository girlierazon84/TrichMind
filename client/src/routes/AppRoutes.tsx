// client/src/routes/AppRoutes.tsx

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import { RegistrationPage, LoginPage, HomePage } from "@/pages"; // ✅ Add HomePage import
import { BottomNav } from "@/components/BottomNav";
import { PrivateRoute, PublicRoute } from "@/routes";


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

// ──────────────────────────────
// Routes Component
// ──────────────────────────────
export const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

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
                                    <HomePage />  {/* ✅ Render actual HomePage component */}
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
