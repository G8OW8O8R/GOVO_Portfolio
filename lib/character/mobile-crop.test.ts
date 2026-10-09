import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { IMAGE, computeCharacterBox, isDesktopViewport } from "../character-box";
import { CHAIN_WEIGHT_MARGIN, DIAMOND_RECT, EYES, TUNING, type Vec2 } from "./config";
import { CROP_MAX_ASPECT, CROP_MEDIA, CROP_MEDIA_ASPECT, MOBILE_CROP, MOBILE_CROP_FILE, TOOLBAR_ALLOWANCE, cropFits, toCropSpace, visibleImageRect, warpReach } from "./mobile-crop";
import { seededRng } from "./motion";
import { REST_FRAME, warpSource } from "./sim";

const phones = [
  [360, 800],
  [375, 812],
  [390, 844],
  [393, 852],
  [412, 823],
  [412, 915],
  [414, 896],
  [430, 932],
] as const;

const visible = (width: number, height: number) => {
  const box = computeCharacterBox({ width, height }, "mobile");
  return visibleImageRect(box, { width, height: box.areaHeight });
};

describe("mobile crop", () => {
  it("moves eyes.json coordinates by the crop origin", () => {
    const iris = EYES.eyes.L.irisCenter as Vec2;
    const [x, y] = toCropSpace(iris);
    expect([x + MOBILE_CROP.x, y + MOBILE_CROP.y]).toEqual(iris);
    expect(toCropSpace([MOBILE_CROP.x, MOBILE_CROP.y])).toEqual([0, 0]);
  });

  it.each(phones)("covers what a %i×%i phone shows, with browser toolbars and the warp reach", (w, h) => {
    expect(isDesktopViewport({ width: w, height: h })).toBe(false);
    expect(w / h).toBeLessThanOrEqual(CROP_MEDIA_ASPECT); // the poster media query picks the crop
    for (const svh of [h, h * TOOLBAR_ALLOWANCE]) {
      const vis = visible(w, svh);
      expect(vis.width).toBeGreaterThan(900);
      expect(cropFits(vis)).toBe(true);
    }
  });

  it("shows everything visible as a poster up to the media query's aspect", () => {
    expect(CROP_MEDIA).toBe(`(max-aspect-ratio: ${Math.round(CROP_MEDIA_ASPECT * 200)}/200)`);
    expect(CROP_MEDIA_ASPECT).toBeGreaterThanOrEqual(CROP_MAX_ASPECT);
    // a still poster needs no warp reach; the engine checks the reach itself
    for (const w of [320, 360, 375, 390, 412, 430, 480])
      for (const svh of [w / CROP_MEDIA_ASPECT, (w / CROP_MEDIA_ASPECT) * TOOLBAR_ALLOWANCE]) expect(cropFits(visible(w, svh), MOBILE_CROP, 0)).toBe(true);
  });

  it("is not used where more of the image is visible", () => {
    expect(cropFits(visible(844, 390))).toBe(false); // phone in landscape
    expect(cropFits(visible(768, 1024))).toBe(false); // tablet portrait
    const desk = computeCharacterBox({ width: 1536, height: 864 }, "desktop");
    expect(cropFits(visibleImageRect(desk, { width: 1536, height: 864 }))).toBe(false);
  });

  it("matches the crop file on disk", () => {
    const b = readFileSync(`public/character/${MOBILE_CROP_FILE}`);
    let i = 2;
    let size: [number, number] | null = null;
    while (i < b.length) {
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xc3) {
        size = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
        break;
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
    expect(size).toEqual([MOBILE_CROP.width, MOBILE_CROP.height]);
    expect(MOBILE_CROP.x % 16).toBe(0);
    expect(MOBILE_CROP.y + MOBILE_CROP.height).toBeLessThanOrEqual(IMAGE.height);
  });

  it("warp reach bounds every displacement at the extreme pose", () => {
    const reach = warpReach();
    const m = CHAIN_WEIGHT_MARGIN;
    const inChainRect = ([x, y]: Vec2) =>
      x >= DIAMOND_RECT.x - m && y >= DIAMOND_RECT.y - m && x <= DIAMOND_RECT.x + DIAMOND_RECT.width + m && y <= DIAMOND_RECT.y + DIAMOND_RECT.height + m ? 1 : 0;
    const rng = seededRng(5);
    let max = 0;
    for (const chain of [TUNING.chainMaxAngle, -TUNING.chainMaxAngle])
      for (const head of [[5, 3], [-5, -3], [5, -3], [-5, 3]] as const)
        for (const sway of [EYES.living.head.sway_rad, -EYES.living.head.sway_rad]) {
          const f = { ...REST_FRAME, breath: 1, chain, head, sway };
          for (let k = 0; k < 400; k++) {
            const q: Vec2 = [rng() * IMAGE.width, rng() * IMAGE.height];
            const p = warpSource(q, f, inChainRect); // full weight wherever the chain texture reaches: worst case
            max = Math.max(max, Math.hypot(q[0] - p[0], q[1] - p[1]));
          }
        }
    expect(max).toBeGreaterThan(10);
    expect(max).toBeLessThanOrEqual(reach);
  });
});
