// client/src/app/(auth)/layout.tsx

import { Suspense, type ReactNode } from "react";
import { PublicOnly } from "@/components/auth";


// Server layout (default) + Suspense boundary to avoid CSR bailout build errors
export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={null}>
            <PublicOnly>{children}</PublicOnly>
        </Suspense>
    );
}
