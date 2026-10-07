import Image from "next/image";

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

/**
 * Numbered path on one surface (How I work, Process): step numbers on a thin
 * line that joins them, not separate cards.
 */
export function Steps({ items, className = "" }: { items: { title: string; text: string }[]; className?: string }) {
  return (
    <ol className={`${ui.surface} px-5 py-6 desk:px-8 desk:py-8 ${className}`}>
      {items.map((item, i) => (
        <li key={item.title} className="relative grid grid-cols-[40px_1fr] gap-x-4 pb-7 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute bottom-1 left-[19.5px] top-11 w-px bg-ink/12" aria-hidden="true" />
          )}
          <span
            className="grid size-10 place-items-center rounded-full bg-win-fill font-mono text-13 tabular-nums text-ink"
            aria-hidden="true"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="pt-2">
            <h4 className="text-17 font-semibold tracking-[-0.01em] text-ink">{item.title}</h4>
            <p className="mt-1 text-15 text-ink-soft">{item.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Green "available" dot (the only colour besides the focus blue). */
export function AvailableDot({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2.5 shrink-0 rounded-full bg-available shadow-[0_0_0_4px_rgb(47_191_90/0.16)] ${className}`}
    />
  );
}

/**
 * Thumbnail that is a neutral placeholder until its file exists
 * (public/skills/<id>.png): same size, no layout change when it arrives.
 */
export function Thumb({ src, className, sizes }: { src: string | null; className: string; sizes: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden rounded-[12px] bg-win-fill shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] ${className}`}
    >
      {src && <Image src={src} alt="" fill sizes={sizes} className="object-cover" />}
    </span>
  );
}
