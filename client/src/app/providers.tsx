// client/src/app/providers.tsx
// This module ensures that all pages use the same AuthProvider.

"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { StyledComponentsRegistry } from "@/lib";
import { theme, GlobalStyle } from "@/styles";
import { AuthProvider } from "@/providers";


export default function Providers({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <StyledComponentsRegistry>
            <ThemeProvider theme={theme}>
                <GlobalStyle />

                <AuthProvider>
                    {children}
                </AuthProvider>
            </ThemeProvider>
        </StyledComponentsRegistry>
    );
}
