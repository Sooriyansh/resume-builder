import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["pdf-parse"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
