// client/src/routes/PublicRoute.tsx

import type React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks";

/**-------------------------------------------------------------------------------------
    A wrapper for <Route> that redirects to the home screen if you're authenticated.
----------------------------------------------------------------------------------------*/
export const PublicRoute = ({ children }: { children: React.ReactElement }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (isAuthenticated) return <Navigate to="/" replace />;

    return children;
};

export default PublicRoute;
