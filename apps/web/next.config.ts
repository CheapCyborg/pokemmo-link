import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence workspace root detection warning in monorepo
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "pokeapi.co" },
    ],
  },
};

export default nextConfig;
