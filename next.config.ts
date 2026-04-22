import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - Some Next.js versions require this at root for dev mobile access
  allowedDevOrigins: ['172.20.10.5', 'localhost:3000'],
};

export default nextConfig;
