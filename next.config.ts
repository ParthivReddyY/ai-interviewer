import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mammoth'],
  // Turbopack configuration - moved from experimental.turbo
  turbopack: {
    // Turbopack automatically handles Node.js module fallbacks
    // No need for manual fallback configuration like webpack
  },
};

export default nextConfig;
