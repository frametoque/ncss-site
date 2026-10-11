import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
        port: "",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
        port: "",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
        port: "",
      },
    ],
  },
};

export default nextConfig;
