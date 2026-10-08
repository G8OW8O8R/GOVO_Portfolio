import { z } from "zod";
import { formatPln } from "./format";
import type { Locale } from "./i18n";

/**
 * Live BTC price in PLN for the "APIs and live data" skill – the same sources
 * as in Obok, no keys:
 *   1. Binance (public data-api.binance.vision) BTCPLN, when the pair really
 *      trades (an order book and trades in the last 24 h),
 *   2. otherwise Binance BTCUSDT × the NBP USD mid rate (rate cached 1 h),
 *   3. fallback CoinGecko simple/price.
 * The result (also "no data") is cached for 30 s; parallel calls share one
 * request. Pure apart from the injected fetcher, so it is tested offline.
 */

export const QUOTE_TTL_MS = 30_000;
export const RATE_TTL_MS = 60 * 60_000;

export const SOURCES = {
  binance: (symbol: string) => `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${symbol}`,
  nbpUsd: "https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json",
  coingecko: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=pln&include_24hr_change=true",
} as const;

export type QuoteSource = "binance" | "binance-nbp" | "coingecko";
export type Quote = { price: number; changePct: number; source: QuoteSource; at: number };

const num = z.coerce.number().refine(Number.isFinite);

const binanceTicker = z.object({
  lastPrice: num,
  priceChangePercent: num,
  bidPrice: num,
  askPrice: num,
  count: num,
});

const nbpRate = z.object({ rates: z.array(z.object({ mid: num })).min(1) });

const coingecko = z.object({ bitcoin: z.object({ pln: num, pln_24h_change: num }) });

/** A ticker that really trades: positive price, a live order book, trades today. */
export function parseBinanceTicker(json: unknown): { price: number; changePct: number } | null {
  const t = binanceTicker.safeParse(json);
  if (!t.success) return null;
  const { lastPrice, priceChangePercent, bidPrice, askPrice, count } = t.data;
  if (lastPrice <= 0 || bidPrice <= 0 || askPrice <= 0 || count <= 0) return null;
  return { price: lastPrice, changePct: priceChangePercent };
}

export function parseNbpRate(json: unknown): number | null {
  const r = nbpRate.safeParse(json);
  const mid = r.success ? r.data.rates[0].mid : 0;
  return mid > 0 ? mid : null;
}

export function parseCoinGecko(json: unknown): { price: number; changePct: number } | null {
  const r = coingecko.safeParse(json);
  if (!r.success || r.data.bitcoin.pln <= 0) return null;
  return { price: r.data.bitcoin.pln, changePct: r.data.bitcoin.pln_24h_change };
}

/** GET → parsed JSON; throws on network errors and non-2xx answers. */
export type FetchJson = (url: string) => Promise<unknown>;

export function createQuoteService(fetchJson: FetchJson, now: () => number = Date.now) {
  let cached: { quote: Quote | null; at: number } | null = null;
  let rate: { value: number; at: number } | null = null;
  let inflight: Promise<Quote | null> | null = null;

  const get = async (url: string) => {
    try {
      return await fetchJson(url);
    } catch {
      return null;
    }
  };

  const usdRate = async () => {
    if (rate && now() - rate.at < RATE_TTL_MS) return rate.value;
    const value = parseNbpRate(await get(SOURCES.nbpUsd));
    if (value) rate = { value, at: now() };
    return value ?? rate?.value ?? null; // an older rate beats none
  };

  const load = async (): Promise<Quote | null> => {
    const pln = parseBinanceTicker(await get(SOURCES.binance("BTCPLN")));
    if (pln) return { ...pln, source: "binance", at: now() };
    const [usdt, usd] = await Promise.all([get(SOURCES.binance("BTCUSDT")).then(parseBinanceTicker), usdRate()]);
    if (usdt && usd) return { price: usdt.price * usd, changePct: usdt.changePct, source: "binance-nbp", at: now() };
    const gecko = parseCoinGecko(await get(SOURCES.coingecko));
    if (gecko) return { ...gecko, source: "coingecko", at: now() };
    return null;
  };

  return {
    async quote(): Promise<Quote | null> {
      if (cached && now() - cached.at < QUOTE_TTL_MS) return cached.quote;
      inflight ??= load().then((quote) => {
        cached = { quote, at: now() };
        inflight = null;
        return quote;
      });
      return inflight;
    },
  };
}

/** "326 516 zł" + "▲0,4%" (PL) / "PLN 326,516" + "▲0.4%" (EN). */
export function formatQuote(q: Pick<Quote, "price" | "changePct">, lang: Locale) {
  const pct = Math.abs(q.changePct).toFixed(1);
  return {
    price: formatPln(q.price, lang),
    change: `${q.changePct < 0 ? "▼" : "▲"}${lang === "pl" ? pct.replace(".", ",") : pct}%`,
    up: q.changePct >= 0,
  };
}
