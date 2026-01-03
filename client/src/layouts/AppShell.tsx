// client/src/layouts/AppLayout.tsx

"use client";

import type { ReactNode } from "react";
import styled from "styled-components";
import { BottomNav } from "@/components";


// Styled component for the layout shell
const Shell = styled.div`
    min-height: 100vh;
    padding-bottom: 84px; /* space for BottomNav */
`;

// AppLayout component that wraps children with Shell and BottomNav
export default function AppShell({ children }: { children: ReactNode }) {
    return (
        <Shell>
            {children}
            <BottomNav />
        </Shell>
    );
}
