// client/src/app/(public)/layout.tsx

"use client";

import type { ReactNode } from "react";
import { PublicOnly } from "@/components/auth";


// Layout component that wraps public pages, ensuring only unauthenticated users can access them
export default function PublicLayout({ children }: { children: ReactNode }) {
    return <PublicOnly>{children}</PublicOnly>;
}
