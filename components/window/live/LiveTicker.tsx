"use client";

import { lazy, Suspense, useRef } from "react";
import type { Locale } from "@/lib/i18n";
import { useLiveRow, useWarmDemo } from "./store";

const loadTicker = () => import("./TickerDemo");
const TickerDemo = lazy(loadTicker);

/**
 * "APIs and live data": while the row is hovered (desktop mouse), a mono
 * line next to the thumbnail with the live BTC price from /api/live/btc.
 * No data – nothing at all.
 */
export function LiveTicker({ id, lang, label }: { id: string; lang: Locale; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const state = useLiveRow(ref, id);
  useWarmDemo(loadTicker);
  return (
    <span ref={ref} className="shrink-0">
      {state !== "off" && (
        <Suspense fallback={null}>
          <TickerDemo active={state === "active"} lang={lang} label={label} />
        </Suspense>
      )}
    </span>
  );
}
