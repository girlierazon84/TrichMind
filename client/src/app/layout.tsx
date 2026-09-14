// client/src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";


const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const THEME_COLOR = "#0d6275"; // theme.colors.fifthly

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME_COLOR,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),

  title: "TrichMind",
  description: "Mindful relapse support for trichotillomania.",

  // ✅ Keep this in sync with your public file name:
  // Put the manifest at: client/public/site.webmanifest
  manifest: "/site.webmanifest",

  themeColor: THEME_COLOR,

  appleWebApp: {
    capable: true,
    title: "TrichMind",
    statusBarStyle: "default",
  },

  icons: {
    // ✅ Standard favicons / PWA icons
    icon: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    // ✅ iOS uses this for “Add to Home Screen”
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
