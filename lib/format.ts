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

/** Price split for display: small "od"/"from" and currency, large amount. */
export function priceParts(value: number, lang: Locale, perMonth = false) {
  return {
    from: lang === "pl" ? "od" : "from",
    amount: groupThousands(value, lang),
    currency: lang === "pl" ? "zł" : "PLN",
    currencyFirst: lang === "en",
    per: perMonth ? (lang === "pl" ? "/ mies." : "/ month") : null,
  };
}

/**
 * Odometer reels for a formatted amount ("1 490", "7,900"): each digit gets
 * the sequence of digits its reel rolls through, ending on the digit itself;
 * separators stay as they are. Like a real counter, the last digit makes a
 * full turn first and higher places move less; a 0 always turns once, so
 * every reel moves.
 */
export function odometerReels(amount: string): (string | number[])[] {
  const chars = [...amount];
  let place = chars.filter((c) => /\d/.test(c)).length;
  return chars.map((c) => {
    if (!/\d/.test(c)) return c;
    place--;
    const digit = Number(c);
    const turns = place === 0 || digit === 0 ? 1 : 0;
    const reel: number[] = [];
    for (let i = 0; i < turns * 10 + digit + 1; i++) reel.push(i % 10);
    return reel;
  });
}

/** Keeps number ranges ("2–3", "1–2") on one line: word joiners around the en dash. */
export const keepRanges = (text: string) => text.replace(/(\d)–(\d)/g, "$1⁠–⁠$2");
