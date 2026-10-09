import fs from "node:fs";
import type { NextConfig } from "next";
import { eyesSchema } from "./lib/character/eyes-schema";
import { ANALYTICS_BASE, UMAMI_ORIGIN, UMAMI_SEND } from "./lib/analytics";
import { nextRedirects } from "./lib/redirects";
import { localizedSegmentRules } from "./lib/routes";

// The character's eyes.json reaches the browser unchecked: a broken file fails here, in every build.
eyesSchema.parse(JSON.parse(fs.readFileSync("public/character/eyes.json", "utf8")));

const nextConfig: NextConfig = {
  // a 404 page for addresses outside every route (the root layout sits under [lang])
  experimental: { globalNotFound: true },
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
  async rewrites() {
    return {
      // Visit statistics through our own domain (lib/analytics.ts), ahead of the app's routes.
      beforeFiles: [
        { source: `${ANALYTICS_BASE}/script.js`, destination: `${UMAMI_ORIGIN}/script.js` },
        ...(UMAMI_SEND === "rewrite" ? [{ source: `${ANALYTICS_BASE}/api/send`, destination: `${UMAMI_ORIGIN}/api/send` }] : []),
      ],
      // English URLs (/en/about) are served from the Polish route folders (/en/o-mnie).
      afterFiles: localizedSegmentRules().map(({ english, internal }) => ({
        source: english,
        destination: internal,
      })),
      fallback: [],
    };
  },
  async redirects() {
    return [
      ...localizedSegmentRules().map(({ english, internal }) => ({
        source: internal,
        destination: english,
        statusCode: 301 as const,
      })),
      // addresses of the previous site (lib/redirects.ts)
      ...nextRedirects(),
    ];
  },
};

export default nextConfig;
