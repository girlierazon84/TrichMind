// client/src/components/auth/PublicOnly.tsx

"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";


type Props = { children: React.ReactNode };

/**-----------------------------------------------------------------------------------------------
    PublicOnly
        - Shows children ONLY when the user is NOT authenticated.
        - If authenticated, redirects to `?next=` (preferred) or `?from=` (legacy) or "/".
    NOTE: Query params are read via `window.location.search` (client-only) to avoid prerender
        issues on Vercel (no useSearchParams()).
--------------------------------------------------------------------------------------------------*/
export const PublicOnly: React.FC<Props> = ({ children }) => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();

    // Read query params only on the client (no useSearchParams -> avoids prerender errors)
    const redirectTo = useMemo(() => {
        if (typeof window === "undefined") return "/";

        const params = new URLSearchParams(window.location.search);
        const raw = params.get("next") ?? params.get("from") ?? "/";

        let decoded = raw;
        try {
            decoded = decodeURIComponent(raw);
        } catch {
            // keep raw if decoding fails
        }

        // Basic open-redirect protection:
        // only allow internal app paths like "/home", "/dashboard?x=1"
        if (!decoded.startsWith("/")) return "/";
        if (decoded.startsWith("//")) return "/";

        return decoded;
    }, []);

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.replace(redirectTo);
        }
    }, [loading, isAuthenticated, router, redirectTo]);

    if (loading) return null;
    if (isAuthenticated) return null; // redirecting

    return <>{children}</>;
};

export default PublicOnly;
