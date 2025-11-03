import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Enables the new React Compiler (Next.js 14+)
  reactCompiler: true,

  // ✅ Enables styled-components SSR support
  compiler: {
    styledComponents: true,
  },

  // ✅ Optional: strict mode and source maps for better DX
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // ✅ Optional: clean URLs or future Next.js features
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
