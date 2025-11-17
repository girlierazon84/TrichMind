// client/src/routes/AppRoutes.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute, PublicRoute } from "@/routes";
import {
    RegistrationPage,
    LoginPage,
    ProfilePage,
    HomePage,
    HealthPage,
    JournalPage,
    TriggersInsightsPage,
    TrichGamePage,
    TrichBotPage
} from "@/pages";
import { useAuth } from "@/hooks";
import { BottomNav } from "@/components";


export const App = () => {
    const { isAuthenticated } = useAuth();
    return (
        <Routes>
            <Route
                path="/trichbot"
                element={
                    <PrivateRoute>
                        <TrichBotPage />
                    </PrivateRoute>
                }
            />

            <Route
                path="/trichgame"
                element={
                    <PrivateRoute>
                        <TrichGamePage />
                    </PrivateRoute>
                }
            />

            <Route
                path="/triggers-insights"
                element={
                    <PrivateRoute>
                        <TriggersInsightsPage />
                    </PrivateRoute>
                }
            />

            <Route
                path="/journal"
                element={
                    <PrivateRoute>
                        <JournalPage />
                    </PrivateRoute>
                }
            />

            <Route
                path="/health"
                element={
                    <PrivateRoute>
                        <HealthPage />
                    </PrivateRoute>
                }
            />

            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <HomePage />
                    </PrivateRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <ProfilePage />
                    </PrivateRoute>
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

            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        {isAuthenticated && <BottomNav />}
        </Routes>
    );
};

export default App;
