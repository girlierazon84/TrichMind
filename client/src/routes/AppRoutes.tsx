// client/src/routes/AppRoutes.tsx

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";
import { useAuth } from "@/hooks";

// Import pages directly (safer than barrel import)
import { PrivateRoute, PublicRoute } from "@/routes";
import { BottomNav } from "@/components";
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


// Define application routes
export const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <BrowserRouter>

            <Routes>
                {/* HOME */}
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

                {/* PROFILE */}
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
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

                {/* LOGIN */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />

                {/* fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Show bottom nav only when logged in */}
            {isAuthenticated && <BottomNav />}
        </BrowserRouter>
    );
};

export default AppRoutes;
