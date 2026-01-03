// client/src/components/auth/RequireAuth.tsx

"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks";


type Props = {
    children: ReactNode;
    fallback?: ReactNode;
};

export function RequireAuth({ children, fallback }: Props) {
    const router = useRouter();
    const pathname = usePathname() ?? "/";

    const { status, token, isAuthenticated } = useAuth();

    useEffect(() => {
        if (status === "hydrating") return;

        if (!token || !isAuthenticated) {
            const next = encodeURIComponent(pathname);
            router.replace(`/login?next=${next}`);
        }
    }, [status, token, isAuthenticated, pathname, router]);

    if (status === "hydrating") return fallback ?? <div>Loading...</div>;
    if (!token || !isAuthenticated) return null;

    return <>{children}</>;
}

export default RequireAuth;
