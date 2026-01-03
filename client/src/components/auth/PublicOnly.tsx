// client/src/components/auth/PublicOnly.tsx

"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks";


// Component that restricts access to unauthenticated users only
type Props = { children: React.ReactNode };

// If the user is authenticated, they are redirected to the home page or a specified "from" page
export const PublicOnly: React.FC<Props> = ({ children }) => {
    // Get authentication status and loading state
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Redirect authenticated users
    useEffect(() => {
        if (!loading && isAuthenticated) {
            // Check for a "from" query parameter to redirect back to the intended page
            const from = searchParams.get("from");
            router.replace(from ? decodeURIComponent(from) : "/");
        }
    }, [loading, isAuthenticated, router, searchParams]);

    // While loading, show a loading indicator
    if (loading) return <div>Loading...</div>;
    if (isAuthenticated) return null; // redirecting

    // Render children for unauthenticated users
    return <>{children}</>;
};

export default PublicOnly;
