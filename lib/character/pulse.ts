import type { Vec2 } from "./config";

/**
 * The character's heartbeat for the rest of the page: the engine emits one
 * pulse per rendered frame (no second animation loop), the logo's owl eyes
 * follow it – same time step, same gaze target, same blink, same light sweep.
 * Nothing is emitted while the character isn't live (reduced motion, no
 * WebGL, slow device, hidden tab), so listeners simply stand still.
 *
 *   const off = characterPulse.subscribe((p) => …);
 */

/** Where the character is looking, in a form another pair of eyes can reuse. */
export type PulseTarget =
  /** a point on screen (cursor, hovered file, window), client px; `reach` = the gaze reach in CSS px */
  | { kind: "point"; x: number; y: number; reach: number }
  /** a direction only (idle wandering, straight at the visitor, scroll on phones), gaze ∈ [-1, 1]² */
  | { kind: "gaze"; gaze: Vec2 };

export type Pulse = {
  /** character clock, s */
  t: number;
  /** time step of this frame, s */
  dt: number;
  target: PulseTarget;
  /** 0 open … 1 closed (blink or eyes held closed in the intro) */
  blink: number;
  /** pendant light sweep progress 0..1, −1 = none */
  sweep: number;
};

type Listener = (p: Pulse) => void;

export function createPulse() {
  const listeners = new Set<Listener>();
  return {
    emit(p: Pulse) {
      listeners.forEach((fn) => fn(p));
    },
    subscribe(fn: Listener): () => void {
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },
    get size() {
      return listeners.size;
    },
  };
}

export const characterPulse = createPulse();
