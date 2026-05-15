import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google profile images (OAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // DigitalOcean Spaces CDN
      {
        protocol: "https",
        hostname: "*.digitaloceanspaces.com",
      },
    ],
  },
};

export default nextConfig;
