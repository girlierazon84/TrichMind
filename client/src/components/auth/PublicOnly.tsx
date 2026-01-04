// client/src/components/auth/PublicOnly.tsx

"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";


type Props = { children: React.ReactNode };

/**--------------------------------------------------------------------------------------------
    PublicOnly
        - Shows children ONLY when the user is NOT authenticated.
        - If authenticated, redirects to `?next=` (preferred) or `?from=` (legacy) or "/".
    NOTE: Query params are read via `window.location.search` (client-only) to avoid prerender
            issues on Vercel.
-----------------------------------------------------------------------------------------------*/
export const PublicOnly: React.FC<Props> = ({ children }) => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();

    // ✅ Read query params only on the client, without setState in an effect
    const redirectTo = useMemo(() => {
        if (typeof window === "undefined") return "/";

        const params = new URLSearchParams(window.location.search);

        // Prefer new "next" param; fall back to legacy "from"
        const next = params.get("next") ?? params.get("from");

        // Safely decode if it's URL-encoded
        if (!next) return "/";

        try {
            return decodeURIComponent(next);
        } catch {
            return next;
        }
    }, []);

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.replace(redirectTo);
        }
    }, [loading, isAuthenticated, router, redirectTo]);

    if (loading) return null; // keep it simple; avoids inline styles + UI flashes
    if (isAuthenticated) return null; // redirecting

    return <>{children}</>;
};

export default PublicOnly;
