import { describe, expect, it } from "vitest";
import { formatPriceFrom, priceParts, groupThousands, keepRanges, odometerReels } from "./format";

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

describe("odometerReels", () => {
  it("ends every reel on its digit and keeps separators", () => {
    const amount = groupThousands(1490, "pl");
    const reels = odometerReels(amount);
    expect(reels.map((r) => (typeof r === "string" ? r : r.at(-1))).join("")).toBe(amount);
    expect(reels[1]).toBe(" ");
  });

  it("turns the last digit and zeros a full round, higher places less", () => {
    const [hundreds, tens, ones] = odometerReels("990") as number[][];
    expect(hundreds).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(tens).toHaveLength(10);
    expect(ones).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    expect(odometerReels("1,000")[0]).toEqual([0, 1]);
    expect(odometerReels("1,000")[2]).toHaveLength(11);
  });

  it("starts every reel at 0", () => {
    for (const reel of odometerReels("7,900")) if (typeof reel !== "string") expect(reel[0]).toBe(0);
  });
});

describe("keepRanges", () => {
  it("glues a number range around its dash and leaves other dashes alone", () => {
    expect(keepRanges("w 2–3 dni – mniej")).toBe("w 2⁠–⁠3 dni – mniej");
  });
});
