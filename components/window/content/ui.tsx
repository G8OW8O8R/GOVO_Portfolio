import Image from "next/image";

/**
 * Shared look of window content: one left axis, a clear type
 * scale (13/15/17/22/28/40/56), near-black actions, mono for technical
 * details instead of uppercase labels. No cards, no beige boxes.
 */
export const ui = {
  page: "mx-auto w-full max-w-[780px] px-6 pb-12 pt-8 desk:px-12 desk:pt-12",
  /** Section display heading */
  display: "text-balance text-40 font-semibold tracking-[-0.035em] text-ink desk:text-56",
  /** Sub-section heading */
  h3: "text-22 font-semibold tracking-[-0.02em] text-ink",
  /** Small plain heading (replaces uppercase eyebrows) */
  label: "text-15 font-semibold tracking-[-0.01em] text-ink",
  lead: "text-pretty text-22 font-medium tracking-[-0.02em] text-ink desk:text-28",
  body: "text-17 text-ink-soft",
  small: "text-15 text-ink-soft",
  /** Technical details: prices, times, step numbers, tags, metadata */
  mono: "font-mono text-13 tracking-[-0.01em] text-ink-soft",
  primary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-15 font-medium text-white transition-colors hover:bg-[#2a2a2a]",
  secondary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ink/20 px-5 text-15 font-medium text-ink transition-colors hover:border-ink/45",
  link: "font-medium text-ink underline decoration-ink/30 decoration-1 underline-offset-[5px] transition-colors hover:decoration-ink",
} as const;

/** Numbered vertical axis with a thin line (How I work, Process). */
export function Timeline({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="relative">
      {items.map((item, i) => (
        <li key={item.title} className="relative grid grid-cols-[44px_1fr] pb-7 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute bottom-0 left-[9px] top-7 w-px bg-win-line" aria-hidden="true" />
          )}
          <span className="pt-[3px] font-mono text-13 tabular-nums text-ink-soft" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
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
      className={`relative block overflow-hidden rounded-[10px] bg-win-fill shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] ${className}`}
    >
      {src && <Image src={src} alt="" fill sizes={sizes} className="object-cover" />}
    </span>
  );
}
