// client/src/components/auth/RequireAuth.tsx

"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import {
    usePathname,
    useRouter,
} from "next/navigation";
import { useAuth } from "@/hooks";


type Props = {
    children: ReactNode;
    fallback?: ReactNode;
};

export function RequireAuth({
    children,
    fallback,
}: Props) {
    const router = useRouter();
    const pathname = usePathname() ?? "/";

    const {
        status,
        isAuthenticated,
    } = useAuth();

    useEffect(() => {
        if (status === "hydrating") {
            return;
        }

        if (
            status === "unauthenticated" ||
            !isAuthenticated
        ) {
            const next = encodeURIComponent(pathname);

            router.replace(
                `/login?next=${next}`
            );
        }
    }, [
        status,
        isAuthenticated,
        pathname,
        router
    ]);

    if (status === "hydrating") {
        return (
            <>
                {fallback ?? null}
            </>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

export default RequireAuth;
