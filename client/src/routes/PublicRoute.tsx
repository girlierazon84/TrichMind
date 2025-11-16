// client/src/routes/PublicRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks";
import { ReactNode } from "react";

interface PublicRouteProps {
    children: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default PublicRoute;
