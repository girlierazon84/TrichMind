// client/src/routes/PublicRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface PublicRouteProps {
    children: React.ReactNode;
}

/**
 * 🪩 PublicRoute
 * Redirects authenticated users away from public pages (like login/register)
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

export default PublicRoute;
