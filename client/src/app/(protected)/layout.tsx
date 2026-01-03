// client/src/app/(protected)/layout.tsx

"use client";

import type { ReactNode } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { AppShell } from "@/layouts";


export default function ProtectedLayout({ children }: { children: ReactNode }) {
    return (
        <RequireAuth>
            <AppShell>{children}</AppShell>
        </RequireAuth>
    );
}
