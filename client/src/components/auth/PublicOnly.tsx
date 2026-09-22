// client/src/components/auth/PublicOnly.tsx

"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";


type Props = {
    children: ReactNode;
};

/**-----------------------------------------------------------------------------------
    PublicOnly
        - Renders children only for unathenticated users.
        - Waits until authentication hydration is complete.
        - Redirects authenticated users to the intended internal route or "/home".
--------------------------------------------------------------------------------------*/
export const PublicOnly = ({
    children,
}: Props) => {
    const router = useRouter();

    const {
        status,
        isAuthenticated,
    } = useAuth();

    useEffect(() => {
        if (
            status !== "authenticated" ||
            !isAuthenticated
        ) {
            return;
        }

        const params =
            new URLSearchParams(
                window.location.search
            );

        const raw =
            params.get("next") ??
            params.get("from");

        let redirectTo = "/home";

        if (raw) {
            try {
                const decoded =
                    decodeURIComponent(raw);
                if (
                    decoded.startsWith("/") &&
                    !decoded.startsWith("//")
                ) {
                    redirectTo = decoded;
                }
            } catch {
                // Use the default route.
            }
        }

        router.replace(redirectTo);
    }, [
        status,
        isAuthenticated,
        router
        ]
    );

    if (status === "hydrating") {
        return null;
    }

    if(isAuthenticated) {
        return null; // redirecting
    }

    return <>{children}</>;
};

export default PublicOnly;
