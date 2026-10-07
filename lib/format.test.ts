import { describe, expect, it } from "vitest";
import { formatPriceFrom, priceParts, groupThousands } from "./format";

describe("prices", () => {
  it("groups thousands like the pricing source (non-breaking space in PL)", () => {
    expect(groupThousands(990, "pl")).toBe("990");
    expect(groupThousands(1490, "pl")).toBe("1 490");
    expect(groupThousands(7900, "en")).toBe("7,900");
  });

  it("always says 'from'", () => {
    expect(formatPriceFrom(2490, "pl")).toBe("od 2 490 zł");
    expect(formatPriceFrom(2490, "en")).toBe("from PLN 2,490");
    expect(formatPriceFrom(99, "pl", true)).toBe("od 99 zł / mies.");
    expect(formatPriceFrom(99, "en", true)).toBe("from PLN 99 / month");
  });
});

describe("priceParts", () => {
  it("splits a price for the pricing rows", () => {
    expect(priceParts(2490, "pl")).toEqual({ from: "od", amount: "2 490", currency: "zł", currencyFirst: false, per: null });
    expect(priceParts(99, "en", true)).toEqual({ from: "from", amount: "99", currency: "PLN", currencyFirst: true, per: "/ month" });
  });
});
