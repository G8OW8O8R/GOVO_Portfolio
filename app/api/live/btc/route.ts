import { QUOTE_TTL_MS, createQuoteService } from "@/lib/live-price";

/**
 * Live BTC/PLN for the "APIs and live data" skill demo (lib/live-price.ts:
 * Binance → Binance × NBP → CoinGecko, cached 30 s per instance and 30 s on
 * the CDN). No data → 204 and the demo shows nothing.
 */

const service = createQuoteService(async (url) => {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
});

const seconds = QUOTE_TTL_MS / 1000;

export async function GET() {
  const quote = await service.quote();
  if (!quote) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  return Response.json(
    { price: quote.price, changePct: quote.changePct, source: quote.source, at: quote.at },
    { headers: { "Cache-Control": `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds}` } },
  );
}
