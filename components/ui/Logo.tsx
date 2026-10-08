import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LOGO } from "@/lib/logo-eyes";

const cache = new Map<string, string>();

function raw(): string {
  return readFileSync(join(process.cwd(), "public", "brand", "logo.svg"), "utf8")
    .replace(/<\?xml[^>]*>\s*/, "")
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/\srole="img"/, "")
    .replace(/\saria-label="[^"]*"/, "")
    .replace("<svg ", '<svg aria-hidden="true" focusable="false" class="block h-full w-auto" ');
}

/**
 * Light sweep across the letters: the letters drawn once more on
 * top, filled with a light band whose gradientTransform LogoLink moves. No
 * mask – a mask over the wordmark re-rendered with every eye movement (+150 ms
 * TBT in Lighthouse). The owl eyes are not part of it, so they never repaint it.
 * `fill` moves from the groups to the <svg>, so the copies take the band's fill.
 */
const { width, skew } = LOGO.sweep;
const SWEEP = `<defs><linearGradient id="govo-sweep-g" gradientUnits="userSpaceOnUse" x1="0" x2="${width}" y1="0" y2="0" gradientTransform="translate(${-2 * width} 0) skewX(${skew})"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><g id="govo-sweep" fill="url(#govo-sweep-g)" fill-rule="evenodd" opacity="0" visibility="hidden"><use href="#govo-G"/><use href="#govo-OVO"/><use href="#digital" fill-rule="nonzero"/></g>`;

/**
 * public/brand/logo.svg inlined (fill currentColor), ids kept for the owl
 * eyes (#govo-eye-L/R) and the sweep. Decorative: the surrounding link
 * carries the accessible name.
 * - "live": the header logo, animated by LogoLink
 * - "outline": the intro – every path drawn as a stroke (pathLength 1)
 * - "solid": the intro – the filled logo appearing over the outline
 * Intro copies get prefixed ids, so they never clash with the header logo.
 */
type Variant = "live" | "outline" | "solid";

function logoMarkup(variant: Variant): string {
  const hit = cache.get(variant);
  if (hit) return hit;
  let svg = raw();
  if (variant === "live") {
    svg = svg
      .replace(/(<g id="(?:wordmark|digital)") fill="currentColor"/g, "$1")
      .replace("<svg ", '<svg fill="currentColor" ')
      .replace("</svg>", `${SWEEP}</svg>`);
  }
  else svg = svg.replace(/\sid="/g, ` id="intro-${variant}-`);
  if (variant === "outline") svg = svg.replace(/<path /g, '<path pathLength="1" ');
  cache.set(variant, svg);
  return svg;
}

export function Logo({ className, variant = "live" }: { className?: string; variant?: Variant }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: logoMarkup(variant) }} />;
}
