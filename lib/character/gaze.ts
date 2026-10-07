import { DERIVED, EYES, TUNING, type EyeSide, type Vec2 } from "./config";
import { between, clamp, smoothstep, type Rng } from "./motion";

/**
 * Gaze vector g ∈ [-1, 1]²: x −1 = figure's left on screen, y −1 = up.
 * Both eyes share it (eyes.json notes).
 */

/**
 * Point (image px) → gaze. Saturating per axis, so a cursor far away still
 * looks natural and the vector never leaves [-1, 1].
 */
export function pointToGaze([px, py]: Vec2, [fx, fy]: Vec2, reach: number = TUNING.gazeReach): Vec2 {
  const dx = px - fx;
  const dy = py - fy;
  // ≈ 0.7 at `reach`, → 1 far away
  return [dx / Math.hypot(dx, reach), dy / Math.hypot(dy, reach)];
}

/** Gaze → iris offset in image px, inside eyes.json range (clamped). */
export function irisOffset([gx, gy]: Vec2, side: EyeSide = "L"): Vec2 {
  const { x, y } = EYES.eyes[side].range;
  const cx = clamp(gx, -1, 1);
  const cy = clamp(gy, -1, 1);
  return [cx < 0 ? -cx * x[0] : cx * x[1], cy < 0 ? -cy * y[0] : cy * y[1]];
}

/**
 * How much of the layered eye reconstruction is shown (0 = untouched base
 * image). Driven by the sprung iris offset and the eyelid layer, never by the
 * cursor, so it fades smoothly both ways.
 */
export function eyeBlend(offset: Vec2, lidAlpha: number): number {
  const len = Math.hypot(offset[0], offset[1]);
  return Math.max(smoothstep(TUNING.eyeBlend.from, TUNING.eyeBlend.to, len), clamp(lidAlpha, 0, 1));
}

export type GazeSource = "lookAt" | "pointer" | "idle";

export type GazeInput = {
  /** seconds */
  now: number;
  /** last pointer position as gaze, with the time it moved */
  pointer: { gaze: Vec2; at: number } | null;
  /** explicit "look at this" (file under the cursor), as gaze */
  lookAt: Vec2 | null;
  /** a random desktop file to glance at while idle, as gaze */
  glance: () => Vec2 | null;
};

/**
 * Picks the gaze target: lookAt > recent pointer > idle wandering.
 * Idle: after ~4 s without pointer movement the eyes wander slowly between
 * random points, sometimes rest straight ahead and sometimes glance at a file.
 */
export class GazeDirector {
  source: GazeSource = "idle";
  private wander: Vec2 = [0, 0];
  /** first wander only after ~4 s without input, also right after page load */
  private nextChange: number = DERIVED.idleAfterS;

  constructor(private readonly rng: Rng) {}

  update({ now, pointer, lookAt, glance }: GazeInput): Vec2 {
    if (lookAt) {
      this.source = "lookAt";
      return lookAt;
    }
    if (pointer && now - pointer.at < DERIVED.idleAfterS) {
      this.source = "pointer";
      this.wander = pointer.gaze;
      this.nextChange = -1;
      return pointer.gaze;
    }
    if (this.source !== "idle") {
      // just went idle: hold the last direction a moment before wandering
      this.source = "idle";
      this.nextChange = now + between(this.rng, [0.6, 1.4]);
    }
    if (this.nextChange < 0) this.nextChange = now + between(this.rng, [0.6, 1.4]);
    if (now >= this.nextChange) this.pick(now, glance);
    return this.wander;
  }

  private pick(now: number, glance: () => Vec2 | null) {
    const r = this.rng();
    const file = r < 0.25 ? glance() : null;
    if (file) {
      this.wander = file;
      this.nextChange = now + between(this.rng, [0.9, 1.7]);
    } else if (r < 0.45) {
      this.wander = [0, 0];
      this.nextChange = now + between(this.rng, [1.8, 3.6]);
    } else {
      this.wander = [between(this.rng, [-0.75, 0.75]), between(this.rng, [-0.5, 0.45])];
      this.nextChange = now + between(this.rng, [1.2, 3.2]);
    }
  }
}
