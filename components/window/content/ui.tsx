import Image from "next/image";

/** Shared look of window content (light macOS window, amber accent from the mockups). */
export const ui = {
  page: "mx-auto w-full max-w-[880px] px-5 pb-8 pt-6 desk:px-10 desk:pt-8",
  eyebrow: "text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-soft",
  pill: "inline-flex items-center rounded-full bg-win-card px-3 py-1 text-[13px] text-ink-soft",
  tag: "inline-flex items-center rounded-full border border-win-line px-2 py-0.5 text-[12px] leading-[1.35] text-ink-soft",
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[14.5px] font-medium text-white shadow-sm transition-[filter] hover:brightness-110",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-full border border-ink/25 px-5 py-2.5 text-[14.5px] font-medium text-ink transition-colors hover:bg-black/[0.04]",
  card: "rounded-2xl border border-win-line bg-white",
  body: "text-[15.5px] leading-relaxed text-ink-soft",
} as const;

/**
 * Thumbnail that is a neutral placeholder until its file exists
 * (public/skills/<id>.png): same size, no layout change when it arrives.
 */
export function Thumb({ src, className, sizes }: { src: string | null; className: string; sizes: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden rounded-[10px] bg-[linear-gradient(135deg,#ececee,#dcdcdf)] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] ${className}`}
    >
      {src && <Image src={src} alt="" fill sizes={sizes} className="object-cover" />}
    </span>
  );
}
