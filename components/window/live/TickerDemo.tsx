"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import type { Locale } from "@/lib/i18n";
import { QUOTE_TTL_MS, formatQuote } from "@/lib/live-price";
import { LIVE } from "@/lib/motion-tokens";

const quoteSchema = z.object({ price: z.number().positive(), changePct: z.number() });
type LiveQuote = z.infer<typeof quoteSchema>;

/** Last answer, shared by every mount: hovering again within 30 s asks nobody. */
let last: { quote: LiveQuote | null; at: number } | null = null;

async function load(): Promise<LiveQuote | null> {
  if (last && Date.now() - last.at < QUOTE_TTL_MS) return last.quote;
  let quote: LiveQuote | null = null;
  try {
    const res = await fetch("/api/live/btc");
    if (res.status === 200) {
      const parsed = quoteSchema.safeParse(await res.json());
      quote = parsed.success ? parsed.data : null;
    }
  } catch {}
  last = { quote, at: Date.now() };
  return quote;
}

/**
 * "BTC 326 516 zł ▲0,4% · na żywo": refreshed every 30 s while mounted; a
 * digit that changed blinks once (opacity). Fades with its row.
 */
export default function TickerDemo({ active, lang, label }: { active: boolean; lang: Locale; label: string }) {
  // the previous quote too: its digits tell which ones changed
  const [{ quote, before }, setQuotes] = useState(() => ({ quote: last?.quote ?? null, before: null as LiveQuote | null }));

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      load().then((q) => {
        if (alive) setQuotes((s) => (s.quote?.price === q?.price ? { ...s, quote: q } : { quote: q, before: s.quote }));
      });
    refresh();
    const timer = setInterval(refresh, LIVE.refreshMs);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (!quote) return null;
  const text = formatQuote(quote, lang);
  const was = before ? formatQuote(before, lang).price : null;

  return (
    <span
      className={`font-mono text-13 tracking-[-0.01em] whitespace-nowrap text-ink-soft tabular-nums transition-opacity ease-out starting:opacity-0 ${active ? "opacity-100" : "opacity-0"}`}
      style={{ transitionDuration: `${LIVE.crossfadeMs}ms` }}
    >
      BTC{" "}
      {[...text.price].map((ch, i) => {
        const changed = was !== null && was[i] !== ch;
        return (
          <span key={`${i}:${ch}`} className={changed ? "live-blink" : undefined}>
            {ch}
          </span>
        );
      })}{" "}
      <span className="inline-flex items-baseline gap-[3px] text-ink">
        <svg viewBox="0 0 8 7" className={`size-[7px] self-center ${text.up ? "" : "rotate-180"}`} aria-hidden="true">
          <path d="M4 0 8 7H0z" fill="currentColor" />
        </svg>
        <span className="sr-only">{text.up ? "+" : "−"}</span>
        {text.change.slice(1)}
      </span>{" "}
      · {label}
    </span>
  );
}
