import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'export' only when building for Capacitor (via EXPORT=true)
  // Vercel deployment will use the default dynamic/SSR output for API support
  output: process.env.EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
