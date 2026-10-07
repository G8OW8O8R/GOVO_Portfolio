import { describe, expect, it } from "vitest";
import { FACE, computeCharacterBox, imageToScreen } from "./character-box";
import {
  SIDE,
  WINDOW,
  clampWindowOffset,
  computeWindowRect,
  faceRect,
  isSideLayout,
  shiftedCharacterBox,
  type Rect,
} from "./window-layout";

/** Eyes in character-image px. */
const EYES_Y = 340;

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe("side layout: the character steps aside", () => {
  for (const vp of [
    { width: 1280, height: 720 },
    { width: 1536, height: 864 },
    { width: 1920, height: 1080 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 2560, height: 1440 },
    { width: 2560, height: 1080 },
  ]) {
    describe(`${vp.width}×${vp.height}`, () => {
      const r = computeWindowRect(vp);
      const face = faceRect(vp);

      it("never covers the face", () => {
        expect(isSideLayout(vp)).toBe(true);
        expect(overlaps(r, face)).toBe(false);
        expect(r.x).toBeGreaterThan(face.x + face.width);
      });

      it("puts the face at ~28% of the width, 0.85 scale, standing on the bottom edge", () => {
        const b = shiftedCharacterBox(vp);
        const box = computeCharacterBox(vp, "desktop");
        expect(b.x + FACE.x * b.scale).toBeCloseTo(SIDE.faceShare * vp.width, 5);
        expect(b.scale / box.scale).toBeCloseTo(SIDE.scale, 5);
        expect(b.y + b.height).toBeCloseTo(vp.height, 5);
      });

      it("takes the space right of the pendant, almost full height", () => {
        const [pendantRight] = imageToScreen(shiftedCharacterBox(vp), [SIDE.pendantRight, 0]);
        expect(r.x).toBeGreaterThanOrEqual(pendantRight);
        expect(r.x + r.width).toBeLessThanOrEqual(vp.width - WINDOW.sideMargin + 0.001);
        expect(r.width).toBeLessThanOrEqual(SIDE.maxWidth);
        expect(r.y).toBe(SIDE.top);
        expect(r.y + r.height).toBe(vp.height - WINDOW.bottomGap);
      });
    });
  }

  it("is ~60% of the width on common laptops", () => {
    for (const vp of [
      { width: 1280, height: 720 },
      { width: 1536, height: 864 },
      { width: 1920, height: 1080 },
    ]) {
      const share = computeWindowRect(vp).width / vp.width;
      expect(share).toBeGreaterThan(0.56);
      expect(share).toBeLessThan(0.68);
    }
  });
});

describe("narrow desktop (768–1023 px): the window stays below the eyes", () => {
  for (const vp of [
    { width: 900, height: 700 },
    { width: 1000, height: 800 },
    { width: 1000, height: 600 },
  ]) {
    it(`${vp.width}×${vp.height}`, () => {
      expect(isSideLayout(vp)).toBe(false);
      const r = computeWindowRect(vp);
      expect(r.height).toBeGreaterThanOrEqual(WINDOW.minHeight);
      const [, eyes] = imageToScreen(computeCharacterBox(vp, "desktop"), [0, EYES_Y]);
      expect(r.y).toBeGreaterThan(eyes);
    });
  }
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
