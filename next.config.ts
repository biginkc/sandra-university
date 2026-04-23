import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["university.bmhgroup.com", "localhost:3100"],
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
