import { existsSync } from "node:fs";
import { join } from "node:path";

/** Absolute site origin for metadata (canonical, hreflang, OG). */
export const SITE_URL =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const CV_PATH = "/cv/CV.pdf";

/** Whether a file exists in public/ (checked on the server, at build time for static pages). */
export function publicFileExists(publicPath: string): boolean {
  return existsSync(join(process.cwd(), "public", publicPath));
}

/** The CV file and window are shown only when the PDF exists (no dead links). */
export function hasCv(): boolean {
  return publicFileExists(CV_PATH);
}

/** Optional asset: its public path when the file exists, otherwise null (placeholder). */
export function optionalAsset(publicPath: string): string | null {
  return publicFileExists(publicPath) ? publicPath : null;
}
