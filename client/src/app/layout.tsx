// client/src/app/layout.tsx
"use client";
import { GlobalStyle } from "../styles/GlobalStyle";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GlobalStyle />
        {children}
      </body>
    </html>
  );
}
