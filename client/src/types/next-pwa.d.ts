// client/src/types/next-pwa.d.ts


declare module "next-pwa" {
    import type { NextConfig } from "next";

    type PWAPluginOptions = {
        dest?: string;
        register?: boolean;
        skipWaiting?: boolean;
        disable?: boolean;

        // Use unknown instead of any to satisfy strict lint rules
        runtimeCaching?: unknown;
        buildExcludes?: unknown;
        publicExcludes?: unknown;

        sw?: string;
        scope?: string;

        // Allow extra keys without using any
        [key: string]: unknown;
    };

    export default function nextPWA(
        options?: PWAPluginOptions
    ): (nextConfig: NextConfig) => NextConfig;
}
