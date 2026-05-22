import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leaflet uses browser-only APIs; exclude from server-side bundling
  serverExternalPackages: ['leaflet'],
};

export default nextConfig;
