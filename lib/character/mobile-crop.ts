import { FIGURE, IMAGE, MOBILE, computeCharacterBox, type CharacterBox } from "../character-box";
import { CHAIN_WEIGHT_MARGIN, DIAMOND_RECT, EYES, TUNING, type Vec2 } from "./config";

/**
 * Full-resolution crop of base.jpg for phones (public/character/base-mobile.jpg):
 * a phone shows only the head-to-pendant part of the image, so the crop keeps
 * the sharpness of the original at a fraction of its size. Everything stays in
 * full-image px (eyes.json); only reads of the base go through toCropSpace().
 */

export type Rect = { x: number; y: number; width: number; height: number };

export const MOBILE_CROP_FILE = "base-mobile.jpg";

/**
 * Viewports (width / height) up to this aspect use the crop for the poster:
 * every portrait phone from 360×800 to 430×932 (≈ 0.45–0.46). Wider (phone in
 * landscape, tablet, desktop) get the full image.
 */
export const CROP_MAX_ASPECT = 1 / 2;
/**
 * The poster media query reaches a little past that, to 412×823 (aspect
 * 0.5006, a common Android size): the crop still holds everything such a phone
 * shows, which is all a still poster needs. The living character also needs
 * the warp reach around it; where the crop falls short of that, the engine
 * loads the full image as its base (cropFits), as on any wider screen.
 */
export const CROP_MEDIA_ASPECT = 101 / 200;
export const CROP_MEDIA = "(max-aspect-ratio: 101/200)";

/**
 * The character box scales with 100svh, which is shorter than the height the
 * media query sees while the browser shows its toolbars. The crop covers svh
 * down to this share of the viewport height.
 */
export const TOOLBAR_ALLOWANCE = 0.8;

/** Crop edges are aligned to JPEG blocks. */
const ALIGN = 16;

/**
 * Upper bound of the warp displacement (image px) anywhere in the image:
 * breathing (lift + chest widening), head (follow + sway) and the chain at its
 * angle limit. Pixels this close to the crop edge may sample from beyond it.
 */
export function warpReach(): number {
  const B = EYES.living.breathing;
  const H = EYES.living.head;
  const breath = B.lift_px + B.chest_expand * (IMAGE.width / 2);
  const headTop: Vec2 = [H.center[0] + H.radius[0], H.center[1] - H.radius[1]];
  const head = Math.hypot(H.follow_gaze_px.x, H.follow_gaze_px.y) + H.sway_rad * Math.hypot(headTop[0] - H.center[0], headTop[1] - TUNING.swayPivotY);
  const [px, py] = EYES.living.chain.pivot;
  const chainCorners: Vec2[] = [
    [DIAMOND_RECT.x - CHAIN_WEIGHT_MARGIN, DIAMOND_RECT.y + DIAMOND_RECT.height + CHAIN_WEIGHT_MARGIN],
    [DIAMOND_RECT.x + DIAMOND_RECT.width + CHAIN_WEIGHT_MARGIN, DIAMOND_RECT.y + DIAMOND_RECT.height + CHAIN_WEIGHT_MARGIN],
  ];
  const chain = TUNING.chainMaxAngle * Math.max(...chainCorners.map(([x, y]) => Math.hypot(x - px, y - py)));
  return Math.ceil(breath + head + chain);
}

/** Part of the image (image px) a stage of this size shows, clamped to the image. */
export function visibleImageRect(box: CharacterBox, stage: { width: number; height: number }): Rect {
  const x0 = Math.max(0, -box.x / box.scale);
  const y0 = Math.max(0, -box.y / box.scale);
  const x1 = Math.min(IMAGE.width, (stage.width - box.x) / box.scale);
  const y1 = Math.min(IMAGE.height, (stage.height - box.y) / box.scale);
  return { x: x0, y: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) };
}

/** Image px the renderer may read for a visible rect: the rect plus the warp reach, clamped to the image. */
function needed(vis: Rect, reach: number): Rect {
  const x0 = Math.max(0, vis.x - reach);
  const y0 = Math.max(0, vis.y - reach);
  const x1 = Math.min(IMAGE.width, vis.x + vis.width + reach);
  const y1 = Math.min(IMAGE.height, vis.y + vis.height + reach);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * The crop: the widest part of the image a portrait phone can show (the
 * character box at aspect CROP_MAX_ASPECT / TOOLBAR_ALLOWANCE, computed with
 * computeCharacterBox), plus the warp reach, aligned outwards to JPEG blocks.
 */
function computeMobileCrop(): Rect {
  const width = 430;
  const height = width / (CROP_MAX_ASPECT / TOOLBAR_ALLOWANCE);
  const box = computeCharacterBox({ width, height }, "mobile");
  const need = needed(visibleImageRect(box, { width, height: box.areaHeight }), warpReach());
  const x0 = Math.floor(need.x / ALIGN) * ALIGN;
  const y0 = Math.floor(need.y / ALIGN) * ALIGN;
  const x1 = Math.min(IMAGE.width, Math.ceil((need.x + need.width) / ALIGN) * ALIGN);
  const y1 = Math.min(IMAGE.height, Math.ceil((need.y + need.height) / ALIGN) * ALIGN);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

export const MOBILE_CROP: Rect = computeMobileCrop();

/** Full-image px → crop px (the one place eyes.json coordinates meet the crop). */
export function toCropSpace([x, y]: Vec2, crop: Rect = MOBILE_CROP): Vec2 {
  return [x - crop.x, y - crop.y];
}

/** True when everything the renderer reads for `vis` lies inside the crop. */
export function cropFits(vis: Rect, crop: Rect = MOBILE_CROP, reach: number = warpReach()): boolean {
  const n = needed(vis, reach);
  const e = 0.5; // layout rounding (1/64 CSS px) and float noise, in image px
  return n.x >= crop.x - e && n.y >= crop.y - e && n.x + n.width <= crop.x + crop.width + e && n.y + n.height <= crop.y + crop.height + e;
}

/** `sizes` for the crop poster: its rendered width (mobile character box). */
export function cropImageSizes(): string {
  const focusHeight = MOBILE.focusBottom - MOBILE.focusTop;
  const up = (n: number) => Math.ceil(n * 10000) / 100;
  const perVh = (MOBILE_CROP.width * MOBILE.maxHeightShare) / focusHeight;
  const perVw = (MOBILE_CROP.width * MOBILE.figureShare) / (FIGURE.right - FIGURE.left);
  return `min(${up(perVh)}vh, ${up(perVw)}vw)`;
}

/** CSS for the crop poster: the crop's place in the character box (--cb-*). */
export function cropPosterCss(selector: string): string {
  const { x, y, width, height } = MOBILE_CROP;
  return `
@media ${CROP_MEDIA} {
  ${selector} {
    left: calc(var(--cb-x) + ${x} * var(--cb-s));
    top: calc(var(--cb-y) + ${y} * var(--cb-s));
    width: calc(${width} * var(--cb-s));
    height: calc(${height} * var(--cb-s));
  }
}`;
}
