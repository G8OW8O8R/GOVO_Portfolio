import type { Locale } from "./i18n";

const NBSP = " ";

/** Groups thousands: "1 490" (PL, non-breaking space) / "1,490" (EN). */
export function groupThousands(value: number, lang: Locale): string {
  const sep = lang === "pl" ? NBSP : ",";
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** Price in PLN: "1 490 zł" / "PLN 1,490". */
export function formatPln(value: number, lang: Locale): string {
  const n = groupThousands(value, lang);
  return lang === "pl" ? `${n}${NBSP}zł` : `PLN${NBSP}${n}`;
}

/** "od 1 490 zł" / "from PLN 1,490", optionally per month. */
export function formatPriceFrom(value: number, lang: Locale, perMonth = false): string {
  const base = `${lang === "pl" ? "od" : "from"} ${formatPln(value, lang)}`;
  if (!perMonth) return base;
  return lang === "pl" ? `${base} / mies.` : `${base} / month`;
}
