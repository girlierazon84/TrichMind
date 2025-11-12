// client/src/routes/AppRoutes.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RegistrationPage } from "@/pages/RegistrationPage";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";

export const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                {!isAuthenticated && (
                    <>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegistrationPage />} />
                    </>
                )}

                {/* Protected routes */}
                {isAuthenticated && (
                    <>
                        <Route path="/" element={<HomePage />} />
                    </>
                )}

                {/* Redirect logic */}
                <Route
                    path="*"
                    element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
                />
            </Routes>

            {/* Global bottom nav for logged-in users */}
            {isAuthenticated && <BottomNav />}
        </BrowserRouter>
    );
};
