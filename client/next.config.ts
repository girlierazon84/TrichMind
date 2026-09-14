// client/next.config.ts

import type { NextConfig } from "next";
import nextPWA from "next-pwa";


const baseConfig: NextConfig = {
  output: "standalone",
  compiler: { styledComponents: true },

  // ✅ Keep Vercel warning fix aligned
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
};

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(baseConfig);