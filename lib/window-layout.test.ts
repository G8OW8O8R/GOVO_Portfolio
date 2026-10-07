import { describe, expect, it } from "vitest";
import { computeCharacterBox, imageToScreen } from "./character-box";
import { WINDOW, clampWindowOffset, computeWindowRect } from "./window-layout";

/** Chin and eyes in character-image px. */
const CHIN_Y = 592;
const EYES_Y = 340;

describe("computeWindowRect", () => {
  for (const vp of [
    { width: 1536, height: 864 },
    { width: 1920, height: 1080 },
    { width: 1280, height: 800 },
    { width: 2560, height: 1440 },
  ]) {
    it(`leaves the face uncovered at ${vp.width}×${vp.height}`, () => {
      const r = computeWindowRect(vp);
      const box = computeCharacterBox(vp, "desktop");
      const [, chin] = imageToScreen(box, [0, CHIN_Y]);
      expect(r.y).toBeGreaterThan(chin);
      expect(r.y + r.height).toBe(vp.height - WINDOW.bottomGap);
      expect(r.x * 2 + r.width).toBeCloseTo(vp.width);
      expect(r.width / vp.width).toBeGreaterThanOrEqual(0.4);
    });
  }

  it("is 64% wide and over half the height at 1536×864", () => {
    const r = computeWindowRect({ width: 1536, height: 864 });
    expect(r.width).toBeCloseTo(983, 0);
    expect(r.height / 864).toBeGreaterThan(0.55);
  });

  it("keeps a minimum height on short screens, still below the eyes", () => {
    const vp = { width: 1280, height: 600 };
    const r = computeWindowRect(vp);
    expect(r.height).toBe(WINDOW.minHeight);
    const [, eyes] = imageToScreen(computeCharacterBox(vp, "desktop"), [0, EYES_Y]);
    expect(r.y).toBeGreaterThan(eyes);
  });
});

describe("clampWindowOffset", () => {
  const vp = { width: 1536, height: 864 };
  const r = computeWindowRect(vp);
  it("keeps the title bar on screen", () => {
    expect(clampWindowOffset(r, { x: 0, y: -2000 }, vp).y).toBe(-r.y);
    expect(clampWindowOffset(r, { x: 0, y: 2000 }, vp).y).toBe(vp.height - 40 - r.y);
    expect(r.x + clampWindowOffset(r, { x: 5000, y: 0 }, vp).x).toBe(vp.width - 120);
    expect(r.x + clampWindowOffset(r, { x: -5000, y: 0 }, vp).x + r.width).toBe(120);
  });
});
