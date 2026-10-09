import { CHAIN_RAY_REACH, CHAIN_WEIGHT_MARGIN, DIAMOND_RECT, EYES, TUNING } from "@/lib/character/config";
import { MOBILE_CROP, MOBILE_CROP_FILE, toCropSpace } from "@/lib/character/mobile-crop";
import { CHARACTER_FILES, CHARACTER_LAYERS } from "@/lib/character/stage";

const [noIrisFile, irisLFile, irisRFile, hlLFile, hlRFile, maskLFile, maskRFile, lidsFile, diamondFile] = CHARACTER_LAYERS;

/**
 * The character's textures: the original files in /character (sharpness),
 * decoded to ImageBitmaps, plus what is derived from them (the chain warp
 * weight, glint candidates). Pure enough to run in a worker
 * (assets.worker.ts) – the pixel work there never blocks the page or the
 * intro – and on the main thread as the fallback.
 */

const SRC = "/character/";
const [W, H] = EYES.image;

/** Union of both eye masks: the only area where base-no-iris is used. */
const { L: EL, R: ER } = EYES.eyes;
export const NO_IRIS_RECT = (() => {
  const x = Math.min(EL.maskOrigin[0], ER.maskOrigin[0]);
  const y = Math.min(EL.maskOrigin[1], ER.maskOrigin[1]);
  const r = Math.max(EL.maskOrigin[0] + EL.maskSize[0], ER.maskOrigin[0] + ER.maskSize[0]);
  const b = Math.max(EL.maskOrigin[1] + EL.maskSize[1], ER.maskOrigin[1] + ER.maskSize[1]);
  return { x, y, width: r - x, height: b - y };
})();

export type Rect = { x: number; y: number; width: number; height: number };

export type CharacterAssets = {
  base: ImageBitmap;
  /** where the base texture sits in the image: full image or MOBILE_CROP */
  baseRect: Rect;
  noIris: ImageBitmap;
  iris: { L: ImageBitmap; R: ImageBitmap };
  highlight: { L: ImageBitmap; R: ImageBitmap };
  mask: { L: ImageBitmap; R: ImageBitmap };
  lids: ImageBitmap;
  diamond: ImageBitmap;
  /** dilated + blurred diamond mask (R8) and where it sits */
  chainWeight: { data: Uint8Array; width: number; height: number; rect: Rect };
  /** candidate glint centres, image px */
  glintPoints: Float32Array;
};

/**
 * Layers with alpha (iris, highlight, lids) are premultiplied here: WebGL
 * ignores UNPACK_PREMULTIPLY_ALPHA for ImageBitmap sources, and the shader
 * composites premultiplied colour (correct bilinear filtering at sprite edges).
 */
async function bitmap(file: string, signal: AbortSignal | undefined, { crop, premultiply = false }: { crop?: Rect; premultiply?: boolean } = {}): Promise<ImageBitmap> {
  const res = await fetch(SRC + file, { signal });
  if (!res.ok) throw new Error(`character asset ${file}: ${res.status}`);
  const blob = await res.blob();
  const opts: ImageBitmapOptions = {
    premultiplyAlpha: premultiply ? "premultiply" : "none",
    colorSpaceConversion: "default",
    // no file has an EXIF orientation, so this is the same as "none" (deprecated)
    imageOrientation: "from-image",
  };
  return crop ? createImageBitmap(blob, crop.x, crop.y, crop.width, crop.height, opts) : createImageBitmap(blob, opts);
}

/** A 2D scratch canvas: OffscreenCanvas (also in the worker), or a detached <canvas> where it doesn't exist (main thread). */
export function scratchCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function pixels(img: ImageBitmap, crop?: Rect): Uint8ClampedArray {
  const r = crop ?? { x: 0, y: 0, width: img.width, height: img.height };
  const canvas = scratchCanvas(r.width, r.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
  return ctx.getImageData(0, 0, r.width, r.height).data;
}

/**
 * Base image pixels of an image-px rectangle (eyes.json coordinates), whether
 * the base is the full image or the phone crop (at any resolution), as RGBA.
 */
export function basePixels(base: ImageBitmap, baseRect: Rect, r: Rect): Uint8ClampedArray {
  const [sx, sy] = toCropSpace([r.x, r.y], baseRect);
  const k = base.width / baseRect.width;
  const canvas = scratchCanvas(r.width, r.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(base, sx * k, sy * k, r.width * k, r.height * k, 0, 0, r.width, r.height);
  return ctx.getImageData(0, 0, r.width, r.height).data;
}

/** Separable max / box filter on a w×h grid, radius in cells. */
function filter(a: Float32Array<ArrayBuffer>, w: number, h: number, r: number, op: "max" | "mean"): Float32Array<ArrayBuffer> {
  for (const horizontal of [true, false]) {
    const b = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let k = -r; k <= r; k++) {
          const xx = horizontal ? Math.min(w - 1, Math.max(0, x + k)) : x;
          const yy = horizontal ? y : Math.min(h - 1, Math.max(0, y + k));
          const v = a[yy * w + xx];
          acc = op === "max" ? Math.max(acc, v) : acc + v;
        }
        b[y * w + x] = op === "max" ? acc : acc / (2 * r + 1);
      }
    a = b;
  }
  return a;
}

/**
 * Chain warp weight at 1/2 resolution: 1 on the chain and pendant (+ ~2 px for
 * their anti-aliased edge) and on the star rays baked into base.jpg around
 * them (thin, slightly coloured bright lines on the dark shirt – the figure
 * is neutral grey, only the sparkles carry colour – so a star never breaks at
 * the mask edge while shirt folds stay put), fading to 0 over
 * TUNING.chainMaskFalloff px.
 */
function chainWeight(diamond: ImageBitmap, base: ImageBitmap, baseRect: Rect) {
  const step = 2;
  const rayReach = CHAIN_RAY_REACH;
  const margin = CHAIN_WEIGHT_MARGIN;
  const w = Math.ceil((diamond.width + 2 * margin) / step);
  const h = Math.ceil((diamond.height + 2 * margin) / step);
  const rect = { x: DIAMOND_RECT.x - margin, y: DIAMOND_RECT.y - margin, width: w * step, height: h * step };
  const mask = pixels(diamond);
  const img = basePixels(base, baseRect, rect);
  // thin bright features: luminance well above its 9×9 neighbourhood (top-hat)
  const lum = new Float32Array(rect.width * rect.height);
  for (let i = 0; i < lum.length; i++) lum[i] = 0.299 * img[i * 4] + 0.587 * img[i * 4 + 1] + 0.114 * img[i * 4 + 2];
  const local = filter(lum, rect.width, rect.height, 4, "mean");
  const onMask = new Float32Array(w * h);
  const bright = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let sy = 0; sy < step; sy++)
        for (let sx = 0; sx < step; sx++) {
          const rx = x * step + sx;
          const ry = y * step + sy;
          const ix = rx - margin;
          const iy = ry - margin;
          if (ix >= 0 && iy >= 0 && ix < diamond.width && iy < diamond.height && mask[(iy * diamond.width + ix) * 4] > 127) onMask[y * w + x] = 1;
          const i = ry * rect.width + rx;
          // below the collar only: the neck skin above is bright too
          const chroma = Math.max(img[i * 4], img[i * 4 + 1], img[i * 4 + 2]) - Math.min(img[i * 4], img[i * 4 + 1], img[i * 4 + 2]);
          if (rect.y + ry > 650 && chroma > 5 && lum[i] - local[i] > 15) bright[y * w + x] = 1;
        }
  const near = filter(onMask, w, h, Math.round(rayReach / step), "max");
  let a = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = onMask[i] || (near[i] && bright[i]) ? 1 : 0;
  // dilation by (1 + half) cells, then two box blurs of total radius half:
  // weight 1 up to ~1 cell outside, 0 beyond ~1 + 2·half cells
  const half = Math.round(TUNING.chainMaskFalloff / 2 / step);
  const r1 = Math.ceil(half / 2);
  a = filter(a, w, h, 1 + half, "max");
  a = filter(a, w, h, r1, "mean");
  if (half - r1 > 0) a = filter(a, w, h, half - r1, "mean");
  const data = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i++) data[i] = Math.round(a[i] * 255);
  return { data, width: w, height: h, rect };
}

/** Bright diamond pixels inside the mask: where glints may appear. */
function glintCandidates(base: ImageBitmap, baseRect: Rect, diamond: ImageBitmap): Float32Array {
  const rect = { x: DIAMOND_RECT.x, y: DIAMOND_RECT.y, width: diamond.width, height: diamond.height };
  const img = basePixels(base, baseRect, rect);
  const mask = pixels(diamond);
  const pts: number[] = [];
  for (let y = 2; y < rect.height - 2; y += 2)
    for (let x = 2; x < rect.width - 2; x += 2) {
      const i = (y * rect.width + x) * 4;
      if (mask[i] < 200) continue;
      const lum = 0.299 * img[i] + 0.587 * img[i + 1] + 0.114 * img[i + 2];
      if (lum > 225) pts.push(rect.x + x + 0.5, rect.y + y + 0.5);
    }
  return new Float32Array(pts);
}

export const FULL_RECT: Rect = { x: 0, y: 0, width: W, height: H };

export type Base = { base: ImageBitmap; baseRect: Rect };
/** What is computed from the full-resolution base. */
export type Derived = Pick<CharacterAssets, "chainWeight" | "glintPoints">;
export type Layers = Omit<CharacterAssets, keyof Base | keyof Derived>;

/** The base: full base.jpg, or on phones the full-resolution crop (MOBILE_CROP). */
export async function loadBase(crop: boolean, signal?: AbortSignal): Promise<Base> {
  return crop
    ? { base: await bitmap(MOBILE_CROP_FILE, signal), baseRect: MOBILE_CROP }
    : { base: await bitmap("base.jpg", signal), baseRect: FULL_RECT };
}

/** Chain warp weight and glint candidates, from the full-resolution base. */
export function derive({ base, baseRect }: Base, diamond: ImageBitmap): Derived {
  return { chainWeight: chainWeight(diamond, base, baseRect), glintPoints: glintCandidates(base, baseRect, diamond) };
}

/** Until derive() has run (the intro's quick start): the chain hangs still, no glints. */
export function underived(): Derived {
  return {
    chainWeight: { data: new Uint8Array(1), width: 1, height: 1, rect: { x: 0, y: 0, width: 1, height: 1 } },
    glintPoints: new Float32Array(),
  };
}

/** The full-resolution base and what is derived from it (the quick start's upgrade). */
export async function loadFullBase(signal: AbortSignal | undefined, crop: boolean): Promise<Base & Derived> {
  const [b, diamond] = await Promise.all([loadBase(crop, signal), bitmap(diamondFile, signal)]);
  const d = derive(b, diamond);
  diamond.close();
  return { ...b, ...d };
}

/** The layers over the base, in the order of CHARACTER_LAYERS (lib/character/stage.ts). */
export async function loadLayers(signal: AbortSignal | undefined, onLoaded?: () => void): Promise<Layers> {
  const count = <T,>(p: Promise<T>): Promise<T> =>
    p.then((v) => {
      onLoaded?.();
      return v;
    });
  const [noIris, irisL, irisR, hlL, hlR, maskL, maskR, lids, diamond] = await Promise.all([
    count(bitmap(noIrisFile, signal, { crop: NO_IRIS_RECT })),
    count(bitmap(irisLFile, signal, { premultiply: true })),
    count(bitmap(irisRFile, signal, { premultiply: true })),
    count(bitmap(hlLFile, signal, { premultiply: true })),
    count(bitmap(hlRFile, signal, { premultiply: true })),
    count(bitmap(maskLFile, signal)),
    count(bitmap(maskRFile, signal)),
    count(bitmap(lidsFile, signal, { premultiply: true })),
    count(bitmap(diamondFile, signal)),
  ]);
  return { noIris, iris: { L: irisL, R: irisR }, highlight: { L: hlL, R: hlR }, mask: { L: maskL, R: maskR }, lids, diamond };
}

/** Everything at full resolution: base, layers, derived data. `onProgress` counts files (CHARACTER_FILES). */
export async function loadCharacterAssets(
  signal: AbortSignal | undefined,
  { crop = false, onProgress }: { crop?: boolean; onProgress?: (loaded: number) => void } = {},
): Promise<CharacterAssets> {
  let loaded = 0;
  const tick = () => onProgress?.(++loaded);
  const [b, layers] = await Promise.all([loadBase(crop, signal).then((v) => (tick(), v)), loadLayers(signal, tick)]);
  if (loaded !== CHARACTER_FILES) throw new Error(`character assets: ${loaded} of ${CHARACTER_FILES}`);
  return { ...b, ...layers, ...derive(b, layers.diamond) };
}
