import { describe, expect, it } from "vitest";
import { LOGO, eyeTransform, logoGaze, sweepBand, viewBoxToClient } from "./logo-eyes";

const parse = (t: string) => {
  const tr = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(t)!;
  const sc = /scale\(1 ([-\d.]+)\)/.exec(t);
  return { tx: Number(tr[1]), ty: Number(tr[2]), sy: sc ? Number(sc[1]) : 1 };
};

describe("logo eyes", () => {
  it("never move more than ±4 viewBox units (5.5 up close)", () => {
    for (const g of [[1, 1], [-1, -1], [3, -7]] as const) {
      const { tx, ty } = parse(eyeTransform([436.3, 179.8], [g[0], g[1]], 0));
      expect(Math.abs(tx)).toBeLessThanOrEqual(LOGO.reach);
      expect(Math.abs(ty)).toBeLessThanOrEqual(LOGO.reach);
    }
    const { tx } = parse(eyeTransform([0, 0], [1, 0], 0, LOGO.near.reach));
    expect(tx).toBe(LOGO.near.reach);
  });

  it("blink squashes around the eye centre", () => {
    const cy = 179.8;
    const { ty, sy } = parse(eyeTransform([436.3, cy], [0, 0], 1));
    expect(sy).toBeCloseTo(LOGO.closedScale, 3);
    // the centre stays where it was
    expect(cy * sy + ty).toBeCloseTo(cy, 1);
    expect(eyeTransform([436.3, cy], [0, 0], 0)).toBe("translate(0 0)");
  });

  it("aims at a point from the logo's own eyes, shares directions as is", () => {
    const eyes = { x: 100, y: 40 };
    const right = logoGaze({ kind: "point", x: 900, y: 40, reach: 350 }, eyes);
    expect(right[0]).toBeGreaterThan(0.8);
    expect(right[1]).toBeCloseTo(0, 5);
    const below = logoGaze({ kind: "point", x: 100, y: 400, reach: 350 }, eyes);
    expect(below[1]).toBeGreaterThan(0.6);
    // up close the same small distance moves the eyes further
    const close = { kind: "point", x: 140, y: 40, reach: 350 } as const;
    expect(logoGaze(close, eyes, true)[0]).toBeGreaterThan(logoGaze(close, eyes)[0] * 2);
    expect(logoGaze({ kind: "gaze", gaze: [0.3, -2] }, eyes)).toEqual([0.3, -1]);
  });

  it("sweeps across the whole wordmark, invisible at both ends", () => {
    expect(sweepBand(-1)).toBeNull();
    const a = sweepBand(0)!;
    const b = sweepBand(1)!;
    expect(a.x + LOGO.sweep.width).toBeLessThan(0);
    expect(b.x).toBeGreaterThanOrEqual(LOGO.viewBox[0] - LOGO.sweep.width);
    expect(a.opacity).toBeCloseTo(0);
    expect(sweepBand(0.5)!.opacity).toBeCloseTo(LOGO.sweep.opacity);
  });

  it("maps viewBox to client px", () => {
    expect(viewBoxToClient([1067, 450], { left: 10, top: 20, width: 106.7, height: 45 })).toEqual({ x: 116.7, y: 65 });
  });
});
