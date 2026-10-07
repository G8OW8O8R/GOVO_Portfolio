import type { ReactNode, SVGProps } from "react";

/** Own glyph set, drawn on a 24×24 grid with a 1.6 stroke. */
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const glyphs = {
  user: (
    <g {...stroke}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
    </g>
  ),
  list: (
    <g {...stroke}>
      <path d="M9.5 7h10M9.5 12h10M9.5 17h10" />
      <circle cx="5.5" cy="7" r="0.9" fill="currentColor" />
      <circle cx="5.5" cy="12" r="0.9" fill="currentColor" />
      <circle cx="5.5" cy="17" r="0.9" fill="currentColor" />
    </g>
  ),
  pdf: (
    <g>
      <rect x="2.5" y="7" width="19" height="10" rx="2.5" fill="currentColor" />
      <text
        x="12"
        y="14.6"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        letterSpacing="0.4"
        fill="var(--paper)"
        fontFamily="var(--font-inter), system-ui, sans-serif"
      >
        PDF
      </text>
    </g>
  ),
  mail: (
    <g {...stroke}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.6" />
      <path d="m4 7.5 8 6 8-6" />
    </g>
  ),
  chat: (
    <g {...stroke}>
      <path d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.3-.2-3.4-.7L4 19.5l1.3-3.6A7.2 7.2 0 0 1 4 11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5Z" />
    </g>
  ),
  linkedin: (
    <g>
      <rect x="3" y="3" width="18" height="18" rx="3.6" fill="currentColor" />
      <g fill="var(--paper)">
        <circle cx="7.9" cy="7.6" r="1.4" />
        <rect x="6.75" y="10" width="2.3" height="7.3" rx="0.4" />
        <path d="M11 10h2.2v1c.5-.8 1.4-1.3 2.5-1.3 2 0 3.1 1.2 3.1 3.6v4H16.5v-3.6c0-1.1-.5-1.7-1.4-1.7-1 0-1.8.7-1.8 2v3.3H11V10Z" />
      </g>
    </g>
  ),
  // GitHub mark (Octicons, MIT), scaled from 16 to 24.
  github: (
    <path
      fill="currentColor"
      transform="translate(1.5 1.5) scale(1.3125)"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
    />
  ),
} satisfies Record<string, ReactNode>;

export type GlyphName = keyof typeof glyphs;

export function Icon({ name, ...props }: { name: GlyphName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      {glyphs[name]}
    </svg>
  );
}
