import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * 🔒 ProtectedRoute — restricts access to authenticated users only.
 */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <p>Loading...</p>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return <>{children}</>;
}

export default ProtectedRoute;
