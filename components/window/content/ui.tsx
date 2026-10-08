import Image from "next/image";
import { Tilt } from "../motion/Tilt";

/**
 * Shared look of window content: white surfaces on the light
 * window ground, soft shadows, rounded corners and air; section leads centred
 * where they introduce a whole tab. One type scale (13/15/17/22/28/40/56),
 * near-black actions, mono only for prices, times, step numbers and tags.
 * Each kind of content gets its own form (rows, a numbered path, large
 * surfaces) – never a grid of identical cards.
 */
export const ui = {
  page: "mx-auto w-full max-w-[860px] px-5 pb-10 pt-7 desk:px-10 desk:pt-9",
  /** White surface: the one container of the windows */
  surface: "rounded-surface bg-surface shadow-surface",
  /** Light grey surface for a highlighted aside (What I'm looking for) */
  fill: "rounded-surface bg-win-fill",
  /** Dark surface (Experience websites) */
  dark: "rounded-surface bg-ink text-white shadow-[0_24px_60px_-24px_rgb(0_0_0/0.55)]",
  /** Main heading of a tab: centred, 56 px on desktop, revealed line by line (RevealHeading) */
  title: "mx-auto max-w-[20ch] text-balance text-center text-40 font-semibold tracking-[-0.035em] text-ink desk:text-56",
  /** Centred lead that opens a tab */
  intro: "mx-auto max-w-[34ch] text-balance text-center text-22 font-semibold tracking-[-0.025em] text-ink desk:text-28",
  introText: "mx-auto mt-3 max-w-[58ch] text-balance text-center text-17 text-ink-soft",
  /** Section display heading */
  display: "text-balance text-28 font-semibold tracking-[-0.03em] text-ink desk:text-40",
  /** Sub-section heading */
  h3: "text-22 font-semibold tracking-[-0.02em] text-ink",
  /** Small plain heading (replaces uppercase eyebrows) */
  label: "text-15 font-semibold tracking-[-0.01em] text-ink",
  lead: "text-pretty text-22 font-medium tracking-[-0.02em] text-ink",
  body: "text-17 text-ink-soft",
  small: "text-15 text-ink-soft",
  /** Technical details: prices, times, step numbers, tags */
  mono: "font-mono text-13 tracking-[-0.01em] text-ink-soft",
  primary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-15 font-medium text-white transition-colors hover:bg-[#2a2a2a]",
  secondary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-surface px-5 text-15 font-medium text-ink shadow-surface transition-shadow hover:shadow-[0_0_0_1px_rgb(17_17_17/0.18),0_1px_2px_rgb(17_17_17/0.04)]",
  link: "font-medium text-ink underline decoration-ink/30 decoration-1 underline-offset-[5px] transition-colors hover:decoration-ink",
} as const;

export { Steps } from "../motion/Steps";

/**
 * Green "available" dot (the only colour besides the focus blue). `pulse`:
 * its halo breathes slowly (opacity, 2.4 s) – the one loop inside windows;
 * it stands still with reduced motion (globals.css `[data-pulse]`).
 */
export function AvailableDot({ className = "", pulse = false }: { className?: string; pulse?: boolean }) {
  return (
    <span aria-hidden="true" className={`relative inline-block size-2.5 shrink-0 rounded-full bg-available ${className}`}>
      <span data-pulse={pulse || undefined} className="absolute -inset-1 rounded-full bg-available/20" />
    </span>
  );
}

/**
 * Thumbnail that is a neutral placeholder until its file exists: same size,
 * no layout change when it arrives. `tilt`: leans towards the cursor (Tilt).
 */
export function Thumb({
  src,
  className,
  sizes,
  tilt = false,
}: {
  src: string | null;
  className: string;
  sizes: string;
  tilt?: boolean;
}) {
  const picture = (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden rounded-[12px] bg-win-fill shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] ${tilt ? "size-full" : className}`}
    >
      {src && <Image src={src} alt="" fill sizes={sizes} className="object-cover" />}
    </span>
  );
  return tilt ? <Tilt className={`block ${className}`}>{picture}</Tilt> : picture;
}
