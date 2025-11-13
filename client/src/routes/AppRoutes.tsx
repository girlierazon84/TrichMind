// client/src/routes/AppRoutes.tsx

import {
    BrowserRouter,
    Routes, Route,
    Navigate
} from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "@/hooks";
import {
    RegistrationPage,
    LoginPage,
    HomePage
} from "@/pages";
import { BottomNav } from "@/components";
import { PrivateRoute, PublicRoute } from "@/routes";


const Page = styled.main`
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: 4rem 1rem;
`;

const Container = styled.div`
    width: 100%;
    max-width: 760px;
    text-align: center;
`;

export const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <BrowserRouter>
            <Page>
                <Container>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <HomePage />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <LoginPage />
                                </PublicRoute>
                            }
                        />

                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <RegistrationPage />
                                </PublicRoute>
                            }
                        />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Container>
            </Page>

            {isAuthenticated && <BottomNav />}
        </BrowserRouter>
    );
};

export default AppRoutes;
