import type { NextConfig } from "next";
import { nextRedirects } from "./lib/redirects";
import { localizedSegmentRules } from "./lib/routes";

const nextConfig: NextConfig = {
  images: {
    // WebP only: Next encodes AVIF at quality × 0.625 (q100 → 63), which
    // smears the character's fine detail. WebP q90 keeps it.
    formats: ["image/webp"],
    qualities: [75, 90],
    // Dense steps up to the 2752 px original so the variant is close to the
    // rendered size × DPR (the character is wider than the viewport).
    deviceSizes: [640, 750, 828, 1080, 1280, 1600, 1920, 2304, 2752, 3840],
  },
  // Generated pictures carry a content hash in the name (scripts/build-images.ts): never revalidated.
  async headers() {
    return [{ source: "/img/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
  // English URLs (/en/about) are served from the Polish route folders (/en/o-mnie).
  async rewrites() {
    return localizedSegmentRules().map(({ english, internal }) => ({
      source: english,
      destination: internal,
    }));
  },
  async redirects() {
    return [
      ...localizedSegmentRules().map(({ english, internal }) => ({
        source: internal,
        destination: english,
        permanent: true,
      })),
      // addresses of the previous site (lib/redirects.ts)
      ...nextRedirects(),
    ];
  },
};

export default nextConfig;
