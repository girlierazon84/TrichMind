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
    TrichBotPage,
} from "@/pages";

import AppLayout from "@/layouts/AppLayout";

/**---------------
    App Routes
------------------*/
export const AppRoutes = () => {
    return (
        <Routes>
            {/* --------------------------------
                Public Routes (NO BottomNav)
            ------------------------------------*/}
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

            {/**---------------------------------------------------------------------
                If you add forgot/reset pages, they also stay here as PublicRoute
            -------------------------------------------------------------------------*/}

            {/**-------------------------------------------------
                Protected Routes (BottomNav is inside Layout)
            -----------------------------------------------------*/}
            <Route element={<AppLayout />}>
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <HomePage />
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
                    path="/triggersinsights"
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
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    }
                />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
