import { existsSync } from "node:fs";
import { join } from "node:path";

/** Absolute site origin for metadata (canonical, hreflang, OG). */
export const SITE_URL =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const CV_PATH = "/cv/CV.pdf";

/** Checked at build time: the CV file is shown only when it exists. */
export function hasCv(): boolean {
  return existsSync(join(process.cwd(), "public", CV_PATH));
}
