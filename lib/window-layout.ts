import { DESKTOP_MEDIA, FACE, computeCharacterBox, isDesktopViewport, type CharacterBox, type Viewport } from "./character-box";
import { springCss } from "./motion-tokens";

/**
 * Where a window sits on the desktop. It never covers the character's face.
 *
 * Side layout (desktop, ≥ 1024 px wide): the character steps aside – the
 * stage slides left so the face sits at ~28% of the width and scales to 0.85
 * (anchored at the bottom edge, the body never lifts off it) – and the window
 * takes the space right of the pendant, almost full height.
 *
 * Narrow desktop (768–1023 px): the figure stays centred and the window starts
 * just below the chin; the dock floats over its bottom edge. On
 * short screens it keeps a minimum height and slides up over the chin.
 *
 * The same constants produce the numeric rects (tests, drag bounds) and the
 * CSS custom properties used for the server-rendered window (no layout shift).
 */

export const WINDOW = {
  /** Chin line in character-image px (2752×1536). */
  chinY: 600,
  /** Gap between chin and window, CSS px. */
  faceGap: 14,
  /** Never above the top bar. */
  minTop: 72,
  /** Window bottom above the viewport bottom; the dock overlaps it. */
  bottomGap: 20,
  minHeight: 420,
  widthShare: 0.64,
  maxWidth: 1040,
  minWidth: 640,
  /** Side margin when the screen is narrower than minWidth + margins. */
  sideMargin: 24,
  /** Full screen: inset from every edge. */
  fullInset: 12,
} as const;

/** The character steps aside (side layout). */
export const SIDE = {
  /** Viewport width from which the side layout applies (on desktop viewports). */
  minWidth: 1024,
  /** Face centre after the shift, as a share of the viewport width. */
  faceShare: 0.28,
  /** Stage scale while a window is open (around the face column at the bottom edge). */
  scale: 0.85,
  /** Right edge of the OVO pendant, character-image px: the window starts here. */
  pendantRight: 1575,
  /** Gap between pendant and window, CSS px. */
  gap: 28,
  top: 64,
  maxWidth: 1240,
} as const;

/** Face incl. hair and ears in character-image px – nothing may cover it. */
export const FACE_BOX = { left: 1180, right: 1560, top: 84, bottom: 600 } as const;

export const SIDE_MEDIA = `${DESKTOP_MEDIA} and (min-width: ${SIDE.minWidth}px)`;

export type Rect = { x: number; y: number; width: number; height: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function isSideLayout(viewport: Viewport): boolean {
  return isDesktopViewport(viewport) && viewport.width >= SIDE.minWidth;
}

/** Stage transform while a window is open: translateX, then scale around (originX, originY). */
export function stageShift({ width: vw, height: vh }: Viewport) {
  return { x: (SIDE.faceShare - 0.5) * vw, scale: SIDE.scale, originX: vw / 2, originY: vh };
}

/** The character box as seen on screen after the stage shift. */
export function shiftedCharacterBox(viewport: Viewport): CharacterBox {
  const box = computeCharacterBox(viewport, "desktop");
  const { x, scale, originX, originY } = stageShift(viewport);
  return {
    x: originX + x + (box.x - originX) * scale,
    y: originY + (box.y - originY) * scale,
    width: box.width * scale,
    height: box.height * scale,
    scale: box.scale * scale,
    areaHeight: box.areaHeight,
  };
}

export function computeWindowRect(viewport: Viewport): Rect {
  const { width: vw, height: vh } = viewport;
  if (isSideLayout(viewport)) {
    const b = shiftedCharacterBox(viewport);
    const left = b.x + SIDE.pendantRight * b.scale + SIDE.gap;
    const avail = vw - WINDOW.sideMargin - left;
    const width = Math.min(avail, SIDE.maxWidth);
    return { x: left + (avail - width) / 2, y: SIDE.top, width, height: vh - WINDOW.bottomGap - SIDE.top };
  }
  const box = computeCharacterBox(viewport, "desktop");
  const width = Math.min(clamp(vw * WINDOW.widthShare, WINDOW.minWidth, WINDOW.maxWidth), vw - 2 * WINDOW.sideMargin);
  const belowChin = box.y + WINDOW.chinY * box.scale + WINDOW.faceGap;
  const y = Math.min(Math.max(belowChin, WINDOW.minTop), vh - WINDOW.bottomGap - WINDOW.minHeight);
  return { x: (vw - width) / 2, y, width, height: vh - WINDOW.bottomGap - y };
}

/** Face box on screen while a window is open (shifted in the side layout). */
export function faceRect(viewport: Viewport): Rect {
  const b = isSideLayout(viewport) ? shiftedCharacterBox(viewport) : computeCharacterBox(viewport, "desktop");
  return {
    x: b.x + FACE_BOX.left * b.scale,
    y: b.y + FACE_BOX.top * b.scale,
    width: (FACE_BOX.right - FACE_BOX.left) * b.scale,
    height: (FACE_BOX.bottom - FACE_BOX.top) * b.scale,
  };
}

export function fullscreenRect({ width, height }: Viewport): Rect {
  const i = WINDOW.fullInset;
  return { x: i, y: i, width: width - 2 * i, height: height - 2 * i };
}

/**
 * Keeps a dragged window's title bar reachable: at least `grip` px of the
 * bar stays on screen horizontally and the bar never leaves the top or bottom.
 */
export function clampWindowOffset(
  rect: Rect,
  offset: { x: number; y: number },
  viewport: Viewport,
  grip = 120,
  barHeight = 40,
): { x: number; y: number } {
  return {
    x: clamp(offset.x, grip - rect.x - rect.width, viewport.width - grip - rect.x),
    y: clamp(offset.y, -rect.y, viewport.height - barHeight - rect.y),
  };
}

/** Same rect as CSS custom properties: --win-x, --win-y, --win-w, --win-h. Desktop only. */
export function windowLayoutCss(selector: string): string {
  const w = `min(clamp(${WINDOW.minWidth}px, ${WINDOW.widthShare * 100}vw, ${WINDOW.maxWidth}px), calc(100vw - ${2 * WINDOW.sideMargin}px))`;
  // --cb-y and --cb-s come from characterBoxCss (desktop variant under the same media query)
  const y = `min(max(calc(var(--cb-y) + ${WINDOW.chinY} * var(--cb-s) + ${WINDOW.faceGap}px), ${WINDOW.minTop}px), calc(100dvh - ${WINDOW.bottomGap + WINDOW.minHeight}px))`;
  // side layout: the face column moves to faceShare·100vw, the pendant scales with it
  const left = `calc(${SIDE.faceShare * 100}vw + ${SIDE.pendantRight - FACE.x} * var(--cb-s) * ${SIDE.scale} + ${SIDE.gap}px)`;
  return `
@media ${DESKTOP_MEDIA} {
  ${selector} {
    --win-w: ${w};
    --win-x: calc((100vw - var(--win-w)) / 2);
    --win-y: ${y};
    --win-h: calc(100dvh - ${WINDOW.bottomGap}px - var(--win-y));
  }
}
@media ${SIDE_MEDIA} {
  ${selector} {
    --win-left: ${left};
    --win-avail: calc(100vw - ${WINDOW.sideMargin}px - var(--win-left));
    --win-w: min(var(--win-avail), ${SIDE.maxWidth}px);
    --win-x: calc(var(--win-left) + (var(--win-avail) - var(--win-w)) / 2);
    --win-y: ${SIDE.top}px;
  }
}`;
}

/**
 * The stage (character layers + pendant) stepping aside while a window is
 * open, and hiding while it is full screen. `open` and `full` are selectors
 * that match an ancestor in those states. Desktop side layout only; the
 * spring is the shared UI spring as a CSS easing.
 */
export function stageShiftCss(stage: string, open: string, full: string): string {
  const shift = `translateX(${(SIDE.faceShare - 0.5) * 100}vw) scale(${SIDE.scale})`;
  return `
@media ${SIDE_MEDIA} {
  ${stage} {
    /* keeps one raster scale: no re-raster of the big poster when the spring settles */
    will-change: transform;
    transform-origin: calc(var(--cb-x) + ${FACE.x} * var(--cb-s)) 100%;
    transition: ${springCss("transform")}, opacity 0.3s ease-out;
  }
  ${open} ${stage} { transform: ${shift}; }
  ${full} ${stage} { transform: translateX(${(SIDE.faceShare - 0.5) * 100 - 14}vw) scale(${SIDE.scale}); opacity: 0; }
}
@media ${SIDE_MEDIA} and (prefers-reduced-motion: reduce) {
  ${stage} { transition: opacity 0.15s; }
}`;
}
