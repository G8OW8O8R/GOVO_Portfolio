import { DESKTOP_MEDIA, computeCharacterBox, type Viewport } from "./character-box";

/**
 * Where a window sits on the desktop. It never covers the character's face:
 * the top edge starts just below the chin, the window is
 * centred and reaches down to the dock, which floats over its bottom edge
 * (as in design/mockup-project-window.jpg). On short screens the window keeps
 * a minimum height and slides up over the chin instead of shrinking further.
 *
 * The same constants produce the numeric rect (tests, drag bounds) and the
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

export type Rect = { x: number; y: number; width: number; height: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function computeWindowRect(viewport: Viewport): Rect {
  const { width: vw, height: vh } = viewport;
  const box = computeCharacterBox(viewport, "desktop");
  const width = Math.min(clamp(vw * WINDOW.widthShare, WINDOW.minWidth, WINDOW.maxWidth), vw - 2 * WINDOW.sideMargin);
  const belowChin = box.y + WINDOW.chinY * box.scale + WINDOW.faceGap;
  const y = Math.min(Math.max(belowChin, WINDOW.minTop), vh - WINDOW.bottomGap - WINDOW.minHeight);
  return { x: (vw - width) / 2, y, width, height: vh - WINDOW.bottomGap - y };
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
  return `
@media ${DESKTOP_MEDIA} {
  ${selector} {
    --win-w: ${w};
    --win-x: calc((100vw - var(--win-w)) / 2);
    --win-y: ${y};
    --win-h: calc(100dvh - ${WINDOW.bottomGap}px - var(--win-y));
  }
}`;
}
