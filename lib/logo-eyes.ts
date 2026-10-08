import type { Vec2 } from "./character/config";
import { pointToGaze } from "./character/gaze";
import { clamp } from "./character/motion";
import type { PulseTarget } from "./character/pulse";

/**
 * The owl eyes in public/brand/logo.svg (#govo-eye-L/R) live with the
 * character: same gaze target, same spring, same blink,
 * the light sweep across the letters at the moment it crosses the diamonds.
 * Units are the logo's viewBox (1067 × 450).
 */
export const LOGO = {
  viewBox: [1067, 450] as const,
  /** max eye shift, viewBox units */
  reach: 4,
  /** hovering the logo: the eyes look at the cursor up close for a moment */
  near: { reach: 5.5, ms: 900, gazeReachShare: 0.25 },
  /** a closed owl eye stays a thin line, not nothing */
  closedScale: 0.1,
  /** light band across the letters */
  sweep: { width: 260, skew: -22, opacity: 0.55 },
  /** local flash on hover, s */
  hoverSweepS: 0.7,
} as const;

/**
 * Gaze for the logo's eyes. A point (cursor, hovered file, window) is aimed
 * at from the logo's own eyes, with the character's gaze reach; a direction
 * (idle, visitor, phone scroll) is shared as is.
 */
export function logoGaze(target: PulseTarget, eyes: { x: number; y: number }, near = false): Vec2 {
  if (target.kind === "gaze") return [clamp(target.gaze[0], -1, 1), clamp(target.gaze[1], -1, 1)];
  const reach = Math.max(1, target.reach * (near ? LOGO.near.gazeReachShare : 1));
  return pointToGaze([target.x, target.y], [eyes.x, eyes.y], reach);
}

/** SVG transform of one eye: shifted by the gaze, squashed around its centre by the blink. */
export function eyeTransform([, cy]: Vec2, [gx, gy]: Vec2, blink: number, reach: number = LOGO.reach): string {
  const dx = clamp(gx, -1, 1) * reach;
  const dy = clamp(gy, -1, 1) * reach;
  const sy = 1 - clamp(blink, 0, 1) * (1 - LOGO.closedScale);
  const r = (v: number) => Math.round(v * 100) / 100;
  if (sy === 1) return `translate(${r(dx)} ${r(dy)})`;
  // squash around the eye's centre line: translate(dx, dy) · T(0, cy) · S · T(0, −cy)
  return `translate(${r(dx)} ${r(dy + cy * (1 - sy))}) scale(1 ${Math.round(sy * 1000) / 1000})`;
}

/** Sweep band x (viewBox) for progress 0..1 and its opacity (fades in and out like the diamonds' sweep). */
export function sweepBand(progress: number): { x: number; opacity: number } | null {
  if (progress < 0 || progress > 1) return null;
  const { width } = LOGO.sweep;
  const from = -width * 1.5;
  const to = LOGO.viewBox[0] + width * 0.5;
  return { x: from + (to - from) * progress, opacity: LOGO.sweep.opacity * Math.sin(Math.PI * progress) };
}

/** Logo viewBox point → client px, given the SVG's box on screen. */
export function viewBoxToClient([vx, vy]: Vec2, box: { left: number; top: number; width: number; height: number }): { x: number; y: number } {
  return { x: box.left + (vx / LOGO.viewBox[0]) * box.width, y: box.top + (vy / LOGO.viewBox[1]) * box.height };
}
