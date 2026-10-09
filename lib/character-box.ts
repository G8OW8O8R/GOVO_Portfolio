import eyes from "@/public/character/eyes.json";

/**
 * Character box: where the 2752×1536 character image sits on screen.
 * Every character layer (poster now, WebGL layers later) and every desktop
 * file slot uses this one geometry, so they stay glued to the figure.
 *
 * The same constants produce both the numeric box (JS, tests, WebGL) and the
 * CSS custom properties (server-rendered layout without layout shift).
 */

export const IMAGE = { width: eyes.image[0], height: eyes.image[1] } as const;

/** Head centre in image px, the horizontal anchor of the figure. */
export const FACE = { x: eyes.living.head.center[0], y: eyes.living.head.center[1] } as const;

/** Figure bounds in image px (top of hair, shoulder/sleeve span). */
export const FIGURE = { top: 84, left: 850, right: 1816 } as const;
const FIGURE_WIDTH = FIGURE.right - FIGURE.left;

/** Layout is "desktop" only where a stage around the figure fits. */
export const DESKTOP_MEDIA = "(min-width: 768px) and (min-height: 540px) and (min-aspect-ratio: 5/6)";

export const DESKTOP = {
  /** Image height relative to viewport height (1 = image fills the height). */
  zoom: 1,
  /** Figure never wider than this share of viewport width. */
  maxFigureShare: 0.42,
} as const;

export const MOBILE = {
  /** Space above the figure for the top bar, in CSS px. */
  top: 56,
  /** Part of the image shown in the top area: hair to below the pendant. */
  focusTop: 60,
  focusBottom: 1080,
  /** Shown part never taller than this share of viewport height. */
  maxHeightShare: 0.46,
  /** Figure width relative to viewport width. */
  figureShare: 0.98,
} as const;

export type Variant = "desktop" | "mobile";
export type Viewport = { width: number; height: number };
export type CharacterBox = {
  /** Image top-left corner in CSS px. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** CSS px per image px. */
  scale: number;
  /** Height of the area reserved for the character (mobile: top area). */
  areaHeight: number;
};

export type Point = readonly [number, number];

export function isDesktopViewport({ width, height }: Viewport): boolean {
  return width >= 768 && height >= 540 && width / height >= 5 / 6;
}

export function computeCharacterBox(viewport: Viewport, variant: Variant): CharacterBox {
  const { width: vw, height: vh } = viewport;

  if (variant === "desktop") {
    const scale = Math.min(
      (DESKTOP.zoom * vh) / IMAGE.height,
      (DESKTOP.maxFigureShare * vw) / FIGURE_WIDTH,
    );
    return {
      x: vw / 2 - FACE.x * scale,
      y: vh - IMAGE.height * scale,
      width: IMAGE.width * scale,
      height: IMAGE.height * scale,
      scale,
      areaHeight: vh,
    };
  }

  const focusHeight = MOBILE.focusBottom - MOBILE.focusTop;
  const scale = Math.min(
    (MOBILE.maxHeightShare * vh) / focusHeight,
    (MOBILE.figureShare * vw) / FIGURE_WIDTH,
  );
  return {
    x: vw / 2 - FACE.x * scale,
    y: MOBILE.top - MOBILE.focusTop * scale,
    width: IMAGE.width * scale,
    height: IMAGE.height * scale,
    scale,
    areaHeight: MOBILE.top + focusHeight * scale,
  };
}

export function imageToScreen(box: CharacterBox, [ix, iy]: Point): Point {
  return [box.x + ix * box.scale, box.y + iy * box.scale];
}

export function screenToImage(box: CharacterBox, [sx, sy]: Point): Point {
  return [(sx - box.x) / box.scale, (sy - box.y) / box.scale];
}

/** Rendered image width as a share of the viewport: [per 1vh, per 1vw]. */
function widthFactors(variant: Variant): [number, number] {
  if (variant === "desktop") {
    return [
      (IMAGE.width * DESKTOP.zoom) / IMAGE.height,
      (IMAGE.width * DESKTOP.maxFigureShare) / FIGURE_WIDTH,
    ];
  }
  const focusHeight = MOBILE.focusBottom - MOBILE.focusTop;
  return [(IMAGE.width * MOBILE.maxHeightShare) / focusHeight, (IMAGE.width * MOBILE.figureShare) / FIGURE_WIDTH];
}

/**
 * `sizes` for the character image: its real rendered width, which is wider
 * than the viewport. Rounded up so the browser never picks a too-small variant.
 */
export function characterImageSizes(): string {
  const fmt = (variant: Variant) => {
    const [perVh, perVw] = widthFactors(variant);
    const up = (n: number) => Math.ceil(n * 10000) / 100;
    return `min(${up(perVh)}vh, ${up(perVw)}vw)`;
  };
  return `${DESKTOP_MEDIA} ${fmt("desktop")}, ${fmt("mobile")}`;
}

/**
 * The same box as CSS custom properties: --cb-s (length per image px),
 * --cb-x, --cb-y, --cb-w, --cb-h, --cb-area. Mirrors computeCharacterBox.
 * Firefox rounds the arguments of min() to 1/60 px; at ~0.56 px per image px
 * that made the character 2 % smaller, so min() compares the length per
 * 1000 image px and the result is divided afterwards.
 */
export function characterBoxCss(selector: string): string {
  const focusHeight = MOBILE.focusBottom - MOBILE.focusTop;
  const k = (share: number) => Math.round(share * 1000 * 1e6) / 1e6;
  const perImagePx = (a: string, b: string) => `calc(min(${a}, ${b}) / 1000)`;
  const shared = `
    --cb-x: calc(50vw - ${FACE.x} * var(--cb-s));
    --cb-w: calc(${IMAGE.width} * var(--cb-s));
    --cb-h: calc(${IMAGE.height} * var(--cb-s));`;

  return `
${selector} {
  --cb-s: ${perImagePx(`${k(MOBILE.maxHeightShare)} * 100svh / ${focusHeight}`, `${k(MOBILE.figureShare)} * 100vw / ${FIGURE_WIDTH}`)};${shared}
  --cb-y: calc(${MOBILE.top}px - ${MOBILE.focusTop} * var(--cb-s));
  --cb-area: calc(${MOBILE.top}px + ${focusHeight} * var(--cb-s));
}
@media ${DESKTOP_MEDIA} {
  ${selector} {
    --cb-s: ${perImagePx(`${k(DESKTOP.zoom)} * 100dvh / ${IMAGE.height}`, `${k(DESKTOP.maxFigureShare)} * 100vw / ${FIGURE_WIDTH}`)};${shared}
    --cb-y: calc(100dvh - ${IMAGE.height} * var(--cb-s));
    --cb-area: 100dvh;
  }
}`;
}
