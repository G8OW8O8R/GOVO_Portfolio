import { glyphs, type GlyphName } from "@/components/ui/glyphs";

/** Desktop document: paper sheet with a folded corner and a glyph. */
export function DocIcon({ glyph, className }: { glyph: GlyphName; className?: string }) {
  return (
    <svg viewBox="0 0 56 70" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M8 1.5h29.5L54.5 18.5V62a6.5 6.5 0 0 1-6.5 6.5H8A6.5 6.5 0 0 1 1.5 62V8A6.5 6.5 0 0 1 8 1.5Z"
        fill="var(--paper)"
        stroke="var(--paper-edge)"
      />
      <path d="M37.5 1.5V13a5.5 5.5 0 0 0 5.5 5.5h11.5" fill="var(--paper-fold)" stroke="var(--paper-edge)" />
      <g transform="translate(14 25) scale(1.17)" color="var(--ink)">
        {glyphs[glyph]}
      </g>
    </svg>
  );
}

/** Phone home-screen tile with the same glyph. */
export function TileIcon({ glyph, className }: { glyph: GlyphName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      {glyphs[glyph]}
    </svg>
  );
}
