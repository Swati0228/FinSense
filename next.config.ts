import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",                          // SW files output to /public
  cacheOnFrontEndNav: true,               // Cache pages on client-side navigation
  aggressiveFrontEndNavCaching: true,     // Aggressively cache JS/CSS/fonts
  reloadOnOnline: true,                   // Auto-reload when internet is restored
  disable: process.env.NODE_ENV === "development", // Disable SW in dev mode
  fallbacks: {
    document: "/offline",                 // Show /offline page when network fails
  },
  workboxOptions: {
    disableDevLogs: true,                 // Clean console output
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
