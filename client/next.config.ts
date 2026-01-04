// client/next.config.ts

import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  output: "standalone",
  compiler: { styledComponents: true },

  // Fix Vercel warning:
  // "Both outputFileTracingRoot and turbopack.root are set, but they must have the same value."
  // Setting both to process.cwd() (the /client directory on Vercel) keeps them aligned.
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
