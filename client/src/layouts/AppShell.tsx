// client/src/layouts/AppShell.tsx

"use client";

import type { ReactNode } from "react";
import styled from "styled-components";
import { BottomNav } from "@/components";


const Shell = styled.div`
    min-height: 100dvh;

    /* ✅ keep content visible above BottomNav */
    padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));

    /* ✅ prevent sideways scroll caused by internal absolute elements */
    overflow-x: clip;
`;

export default function AppShell({ children }: { children: ReactNode }) {
    return (
        <Shell>
            {children}
            <BottomNav />
        </Shell>
    );
}
