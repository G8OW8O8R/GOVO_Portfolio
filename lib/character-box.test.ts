import { describe, expect, it } from "vitest";
import {
  DESKTOP_MEDIA,
  FACE,
  FIGURE,
  IMAGE,
  characterBoxCss,
  characterImageSizes,
  computeCharacterBox,
  imageToScreen,
  isDesktopViewport,
  screenToImage,
} from "./character-box";

const desktops = [
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
  { width: 1280, height: 800 },
  { width: 2560, height: 1080 },
  { width: 1024, height: 768 },
];

describe("computeCharacterBox – desktop", () => {
  it.each(desktops)("centres the face and keeps the figure in view at %o", (vp) => {
    const box = computeCharacterBox(vp, "desktop");
    const [faceX] = imageToScreen(box, [FACE.x, FACE.y]);
    const [, headTop] = imageToScreen(box, [FACE.x, FIGURE.top]);

    expect(faceX).toBeCloseTo(vp.width / 2, 6);
    expect(box.y + box.height).toBeCloseTo(vp.height, 6); // body runs off the bottom edge
    expect(headTop).toBeGreaterThan(0);
    expect(headTop).toBeLessThan(vp.height * 0.25);
    expect((FIGURE.right - FIGURE.left) * box.scale).toBeLessThanOrEqual(vp.width * 0.42 + 1e-6);
  });

  it("gives 16:9 screens the same composition", () => {
    const a = computeCharacterBox({ width: 1536, height: 864 }, "desktop");
    const b = computeCharacterBox({ width: 1920, height: 1080 }, "desktop");
    expect(b.scale / a.scale).toBeCloseTo(1920 / 1536, 6);
    expect(b.y / 1080).toBeCloseTo(a.y / 864, 6);
  });

  it("covers the full width of 16:9 screens (no visible image edge)", () => {
    for (const vp of desktops.slice(0, 2)) {
      const box = computeCharacterBox(vp, "desktop");
      expect(box.x).toBeLessThanOrEqual(0);
      expect(box.x + box.width).toBeGreaterThanOrEqual(vp.width);
    }
  });

  it("keeps the image aspect ratio", () => {
    const box = computeCharacterBox({ width: 1536, height: 864 }, "desktop");
    expect(box.width / box.height).toBeCloseTo(IMAGE.width / IMAGE.height, 6);
  });
});

describe("computeCharacterBox – mobile", () => {
  it.each([
    { width: 390, height: 844 },
    { width: 360, height: 740 },
    { width: 430, height: 932 },
  ])("puts the figure in the top part at %o", (vp) => {
    const box = computeCharacterBox(vp, "mobile");
    const [left] = imageToScreen(box, [FIGURE.left, 0]);
    const [right] = imageToScreen(box, [FIGURE.right, 0]);
    const [faceX] = imageToScreen(box, [FACE.x, FACE.y]);

    expect(faceX).toBeCloseTo(vp.width / 2, 6);
    expect(right - left).toBeLessThanOrEqual(vp.width);
    expect(box.areaHeight).toBeLessThanOrEqual(vp.height * 0.55);
    expect(imageToScreen(box, [FACE.x, FIGURE.top])[1]).toBeGreaterThan(48);
  });
});

describe("characterImageSizes", () => {
  /** Evaluates `min(Avh, Bvw)` for a viewport. */
  const evalMin = (expr: string, { width, height }: { width: number; height: number }) => {
    const [, vh, vw] = expr.match(/min\(([\d.]+)vh, ([\d.]+)vw/)!;
    return Math.min((Number(vh) * height) / 100, (Number(vw) * width) / 100);
  };

  it("matches the rendered width (never smaller, at most 1 px larger)", () => {
    const sizes = characterImageSizes();
    expect(sizes.startsWith(`${DESKTOP_MEDIA} min(`)).toBe(true);
    const [desktopExpr, mobileExpr] = sizes.replace(DESKTOP_MEDIA, "").split("),");

    for (const vp of desktops) {
      const diff = evalMin(desktopExpr, vp) - computeCharacterBox(vp, "desktop").width;
      expect(diff).toBeGreaterThanOrEqual(0);
      expect(diff).toBeLessThan(1);
    }
    for (const vp of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
      const diff = evalMin(mobileExpr, vp) - computeCharacterBox(vp, "mobile").width;
      expect(diff).toBeGreaterThanOrEqual(0);
      expect(diff).toBeLessThan(1);
    }
  });
});

describe("image ↔ screen mapping", () => {
  it("round-trips points", () => {
    const box = computeCharacterBox({ width: 1536, height: 864 }, "desktop");
    const [ix, iy] = screenToImage(box, imageToScreen(box, [1300.3, 330.2]));
    expect(ix).toBeCloseTo(1300.3, 9);
    expect(iy).toBeCloseTo(330.2, 9);
  });
});

describe("isDesktopViewport", () => {
  it("separates desktop and phone layouts", () => {
    expect(isDesktopViewport({ width: 1536, height: 864 })).toBe(true);
    expect(isDesktopViewport({ width: 390, height: 844 })).toBe(false);
    expect(isDesktopViewport({ width: 844, height: 390 })).toBe(false); // phone landscape
    expect(isDesktopViewport({ width: 768, height: 1024 })).toBe(false); // tablet portrait
  });
});

describe("characterBoxCss", () => {
  it("compares lengths per 1000 image px in min() (Firefox rounds its arguments to 1/60 px)", () => {
    const css = characterBoxCss(":root");
    const scales = [...css.matchAll(/--cb-s: calc\(min\(([\d.]+) \* [^,]+, ([\d.]+) \* [^)]+\) \/ 1000\);/g)];
    expect(scales).toHaveLength(2); // phone and desktop
    for (const [, a, b] of scales) {
      expect(Number(a)).toBeGreaterThanOrEqual(100);
      expect(Number(b)).toBeGreaterThanOrEqual(100);
    }
  });
});
