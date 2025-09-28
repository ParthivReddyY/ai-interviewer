import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mammoth'],
  // Turbopack configuration
  turbopack: {
    // Configure resolving for PDF.js
    resolveAlias: {
      // Help Turbopack resolve PDF.js properly
      'pdfjs-dist': 'pdfjs-dist/build/pdf.min.mjs',
    },
  },
  // Webpack configuration as fallback when not using Turbopack
  webpack: (config) => {
    // Ignore Node.js-specific modules in client-side bundles
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
  },
};

export default nextConfig;
