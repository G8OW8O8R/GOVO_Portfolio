import { describe, expect, it, vi } from "vitest";
import {
  QUOTE_TTL_MS,
  RATE_TTL_MS,
  SOURCES,
  createQuoteService,
  formatQuote,
  parseBinanceTicker,
  parseCoinGecko,
  parseNbpRate,
} from "./live-price";

const ticker = (lastPrice: string, priceChangePercent: string, book = "1", count = 100) => ({
  lastPrice,
  priceChangePercent,
  bidPrice: book,
  askPrice: book,
  count,
});
const nbp = (mid: number) => ({ rates: [{ mid }] });
const gecko = (pln: number, change: number) => ({ bitcoin: { pln, pln_24h_change: change } });

function service(answers: Record<string, unknown>, clock = { t: 0 }) {
  const fetchJson = vi.fn(async (url: string) => {
    if (!(url in answers) || answers[url] instanceof Error) throw answers[url] ?? new Error("offline");
    return answers[url];
  });
  return { svc: createQuoteService(fetchJson, () => clock.t), fetchJson, clock };
}

describe("parsers", () => {
  it("accept only a ticker that really trades", () => {
    expect(parseBinanceTicker(ticker("326516.5", "0.42"))).toEqual({ price: 326516.5, changePct: 0.42 });
    // BTCPLN on data-api.binance.vision: a price, but no order book
    expect(parseBinanceTicker(ticker("219901", "1.4", "0"))).toBeNull();
    expect(parseBinanceTicker(ticker("1", "0", "1", 0))).toBeNull();
    expect(parseBinanceTicker({ code: -1121, msg: "Invalid symbol." })).toBeNull();
  });

  it("read the NBP rate and CoinGecko", () => {
    expect(parseNbpRate(nbp(3.91))).toBe(3.91);
    expect(parseNbpRate({ rates: [] })).toBeNull();
    expect(parseCoinGecko(gecko(325172, -0.94))).toEqual({ price: 325172, changePct: -0.94 });
    expect(parseCoinGecko({ bitcoin: {} })).toBeNull();
  });
});

describe("quote service", () => {
  it("prefers BTCPLN when it trades", async () => {
    const { svc } = service({ [SOURCES.binance("BTCPLN")]: ticker("326516", "0.4") });
    expect(await svc.quote()).toMatchObject({ price: 326516, changePct: 0.4, source: "binance" });
  });

  it("falls back to BTCUSDT × NBP, then CoinGecko, then nothing", async () => {
    const dead = ticker("219901", "1.4", "0");
    const a = service({
      [SOURCES.binance("BTCPLN")]: dead,
      [SOURCES.binance("BTCUSDT")]: ticker("83000", "-1"),
      [SOURCES.nbpUsd]: nbp(4),
    });
    expect(await a.svc.quote()).toMatchObject({ price: 332000, changePct: -1, source: "binance-nbp" });

    const b = service({ [SOURCES.binance("BTCPLN")]: dead, [SOURCES.coingecko]: gecko(325000, 0.2) });
    expect(await b.svc.quote()).toMatchObject({ price: 325000, source: "coingecko" });

    const c = service({});
    expect(await c.svc.quote()).toBeNull();
  });

  it("caches 30 s, shares a request in flight and keeps the rate 1 h", async () => {
    const { svc, fetchJson, clock } = service({
      [SOURCES.binance("BTCUSDT")]: ticker("80000", "0"),
      [SOURCES.nbpUsd]: nbp(4),
    });
    const [q1, q2] = await Promise.all([svc.quote(), svc.quote()]);
    expect(q1).toBe(q2);
    const calls = fetchJson.mock.calls.length;
    clock.t = QUOTE_TTL_MS - 1;
    await svc.quote();
    expect(fetchJson.mock.calls.length).toBe(calls);
    clock.t = QUOTE_TTL_MS;
    await svc.quote();
    const nbpCalls = fetchJson.mock.calls.filter(([u]) => u === SOURCES.nbpUsd).length;
    expect(nbpCalls).toBe(1);
    clock.t = RATE_TTL_MS + 1;
    await svc.quote();
    expect(fetchJson.mock.calls.filter(([u]) => u === SOURCES.nbpUsd).length).toBe(2);
  });
});

describe("formatQuote", () => {
  it("formats in both languages", () => {
    expect(formatQuote({ price: 326516.4, changePct: 0.42 }, "pl")).toEqual({
      price: "326 516 zł",
      change: "▲0,4%",
      up: true,
    });
    expect(formatQuote({ price: 326516.4, changePct: -1.25 }, "en")).toMatchObject({
      price: "PLN 326,516",
      change: "▼1.3%",
      up: false,
    });
  });
});
