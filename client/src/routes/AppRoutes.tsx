// client/src/routes/AppRoutes.tsx

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";
import { useAuth } from "@/hooks";

// Import pages directly (safer than barrel import)
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegistrationPage from "@/pages/RegistrationPage";
import ProfilePage from "@/pages/ProfilePage";
import { PrivateRoute, PublicRoute } from "@/routes";
import { BottomNav } from "@/components/BottomNav";


// Define application routes
export const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <BrowserRouter>

            <Routes>
                {/* HOME */}
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
