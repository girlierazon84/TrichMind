// client/next.config.ts

import type { NextConfig } from "next";


// Next.js configuration object
const nextConfig: NextConfig = {
  output: "standalone",
  compiler: {
    styledComponents: true,
  },
  turbopack: {
    root: __dirname,
  },
};

// Export the Next.js configuration object
export default nextConfig;
