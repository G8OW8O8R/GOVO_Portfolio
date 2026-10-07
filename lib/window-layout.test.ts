import { describe, expect, it } from "vitest";
import { computeCharacterBox, imageToScreen } from "./character-box";
import { WINDOW, clampWindowOffset, computeWindowRect, faceRect, overlaps } from "./window-layout";

/** Eyes in character-image px. */
const EYES_Y = 340;

describe("computeWindowRect: centred below the chin, the character stays put", () => {
  for (const vp of [
    { width: 1280, height: 720 },
    { width: 1536, height: 864 },
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 2560, height: 1440 },
    { width: 1024, height: 768 },
    { width: 900, height: 700 },
  ]) {
    describe(`${vp.width}×${vp.height}`, () => {
      const r = computeWindowRect(vp);

      it("is centred and ~64% wide (within the margins)", () => {
        expect(r.x + r.width / 2).toBeCloseTo(vp.width / 2, 5);
        expect(r.width).toBeLessThanOrEqual(Math.min(WINDOW.maxWidth, vp.width - 2 * WINDOW.sideMargin));
        expect(r.width).toBeGreaterThanOrEqual(Math.min(WINDOW.minWidth, vp.width - 2 * WINDOW.sideMargin));
      });

      it("starts below the eyes, never covers the face (unless the screen is too short)", () => {
        const [, eyes] = imageToScreen(computeCharacterBox(vp, "desktop"), [0, EYES_Y]);
        expect(r.y).toBeGreaterThan(eyes);
        if (r.y > WINDOW.minTop && r.height > WINDOW.minHeight) expect(overlaps(r, faceRect(vp))).toBe(false);
      });

      it("reaches down to the bottom gap and keeps a minimum height", () => {
        expect(r.y + r.height).toBe(vp.height - WINDOW.bottomGap);
        expect(r.height).toBeGreaterThanOrEqual(WINDOW.minHeight);
      });
    });
  }
});

describe("overlaps", () => {
  const win = { x: 100, y: 100, width: 200, height: 100 };
  it("detects a rect reaching into another, with a margin", () => {
    expect(overlaps({ x: 290, y: 150, width: 40, height: 40 }, win)).toBe(true);
    expect(overlaps({ x: 305, y: 150, width: 40, height: 40 }, win)).toBe(false);
    expect(overlaps({ x: 305, y: 150, width: 40, height: 40 }, win, 8)).toBe(true);
    expect(overlaps({ x: 100, y: 0, width: 50, height: 90 }, win, 8)).toBe(false);
    expect(overlaps({ x: 100, y: 0, width: 50, height: 95 }, win, 8)).toBe(true);
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
