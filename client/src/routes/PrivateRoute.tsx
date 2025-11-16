// client/src/routes/PrivateRoute.tsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks";
import styled from "styled-components";
import { ReactNode } from "react";

const LoadingWrapper = styled.div`
    text-align: center;
    padding: 2rem 0;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.text_secondary};
`;

interface PrivateRouteProps {
    children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingWrapper>Loading…</LoadingWrapper>;
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                state={{ from: location.pathname }}
                replace
            />
        );
    }

    return <>{children}</>;
};

export default PrivateRoute;
