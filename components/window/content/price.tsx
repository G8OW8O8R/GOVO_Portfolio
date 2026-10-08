import type { ReactNode } from "react";
import { getDictionary } from "@/content/dictionaries";
import type { Pricing } from "@/content/profile/schema";
import { keepRanges, priceParts } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { Odometer } from "../motion/Odometer";
import { ui } from "./ui";

/** "od" small, amount large (mono, tabular, odometer), currency small. */
export function Price({ value, lang, perMonth = false }: { value: number; lang: Locale; perMonth?: boolean }) {
  const p = priceParts(value, lang, perMonth);
  const small = "text-13 text-ink-soft";
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap font-mono tabular-nums">
      <span className={small}>{p.from}</span>
      {p.currencyFirst && <span className={small}>{p.currency}</span>}
      <span className="text-22 font-medium tracking-[-0.03em] text-ink desk:text-28">
        {/* rolls like an odometer the first time its row shows */}
        <Odometer amount={p.amount} />
      </span>
      {!p.currencyFirst && <span className={small}>{p.currency}</span>}
      {p.per && <span className={small}>{p.per}</span>}
    </span>
  );
}

/** One package row: name + sentence | time | price. */
export const packageRow = "grid gap-x-6 gap-y-2 px-5 py-5 desk:grid-cols-[1fr_180px_172px] desk:items-baseline desk:px-7";

type Package = Pricing["packages"][number];

/**
 * The packages a service or local page sells, as rows of one surface – the
 * same rows as Pricing, without the expanded details. `name` may wrap the
 * package name in a link (local pages link each row to its service page).
 */
export function PackageRows({
  packages,
  lang,
  name = (p) => p.name[lang],
  className = "",
}: {
  packages: readonly Package[];
  lang: Locale;
  name?: (p: Package) => ReactNode;
  className?: string;
}) {
  const dict = getDictionary(lang);
  return (
    <ul className={`${ui.surface} divide-y divide-win-line ${className}`}>
      {packages.map((p) => (
        <li key={p.id} className={packageRow}>
          <span className="min-w-0">
            <span className="text-22 font-semibold tracking-[-0.02em] text-ink">{name(p)}</span>
            <span className="mt-1 block text-15 text-ink-soft">{p.description[lang]}</span>
          </span>
          <span className="font-mono text-13 text-ink-soft">
            <span className="sr-only">{dict.offer.time}: </span>
            {keepRanges(p.time[lang])}
          </span>
          <span className="desk:text-right">
            <Price value={p.from} lang={lang} />
          </span>
        </li>
      ))}
    </ul>
  );
}
