import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Optimize for better performance
    optimizeCss: true,
  },
};

export default nextConfig;