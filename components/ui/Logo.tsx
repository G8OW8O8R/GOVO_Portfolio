import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | null = null;

/**
 * public/brand/logo.svg inlined (fill currentColor). Kept as one inline SVG
 * with its ids (#govo-eye-L/R, #digital …) so task 6a can animate the owl eyes.
 * Decorative here: the surrounding link carries the accessible name.
 */
function logoMarkup(): string {
  if (cached) return cached;
  const raw = readFileSync(join(process.cwd(), "public", "brand", "logo.svg"), "utf8");
  cached = raw
    .replace(/<\?xml[^>]*>\s*/, "")
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/\srole="img"/, "")
    .replace(/\saria-label="[^"]*"/, "")
    .replace("<svg ", '<svg aria-hidden="true" focusable="false" class="block h-full w-auto" ');
  return cached;
}

export function Logo({ className }: { className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: logoMarkup() }} />;
}
