import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Locale } from "./i18n";

/** Absolute site origin for metadata (canonical, hreflang, OG); one constant in content. */
export { SITE_URL } from "@/content/profile/contact";

/** Generated CV in the language of the page (scripts/build-cv.ts writes them). */
export function cvPdfPath(lang: Locale): string {
  return `/cv/CV-${lang.toUpperCase()}.pdf`;
}

/** Whether a file exists in public/ (checked on the server, at build time for static pages). */
export function publicFileExists(publicPath: string): boolean {
  return existsSync(join(process.cwd(), "public", publicPath));
}

/** The CV file on the desktop and the download button show only when the PDF exists (no dead links). */
export function hasCv(lang: Locale): boolean {
  return publicFileExists(cvPdfPath(lang));
}

/** Optional asset: its public path when the file exists, otherwise null (placeholder). */
export function optionalAsset(publicPath: string): string | null {
  return publicFileExists(publicPath) ? publicPath : null;
}
