import type { NextConfig } from "next";
import { localizedSegmentRules } from "./lib/routes";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // English URLs (/en/about) are served from the Polish route folders (/en/o-mnie).
  async rewrites() {
    return localizedSegmentRules().map(({ english, internal }) => ({
      source: english,
      destination: internal,
    }));
  },
  async redirects() {
    return localizedSegmentRules().map(({ english, internal }) => ({
      source: internal,
      destination: english,
      permanent: true,
    }));
  },
};

export default nextConfig;
