// client/src/routes/AppRoutes.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute, PublicRoute } from "@/routes";
import { AppLayout } from "@/layouts/AppLayout";
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


// Main application routes component
export const AppRoutes = () => {
    return (
        <Routes>
            {/* App Layout */}
            <Route element={<AppLayout />}>
                {/* Private Routes */}
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
                    path="/health"
                    element={
                        <PrivateRoute>
                            <HealthPage />
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
                    path="/triggers-insights"
                    element={
                        <PrivateRoute>
                            <TriggersInsightsPage />
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
                    path="/trichbot"
                    element={
                        <PrivateRoute>
                            <TrichBotPage />
                        </PrivateRoute>
                    }
                />

                {/* Public Routes */}
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
            </Route>
        </Routes>
    );
};

export default AppRoutes;
