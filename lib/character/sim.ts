import { Blinker } from "./blink";
import { DERIVED, EYES, TUNING, type Vec2 } from "./config";
import { eyeBlend, irisOffset } from "./gaze";
import { Pendulum, Spring2, clamp, smoothstep, softLimit, type Rng } from "./motion";
import { Sparkles, type Glint } from "./sparkles";

const L = EYES.living;

/** Everything the renderer needs for one frame. */
export type CharacterFrame = {
  t: number;
  /** breathing phase 0..1 (0 = rest) */
  breath: number;
  gaze: Vec2;
  /** iris offset, image px (both eyes) */
  iris: Vec2;
  /** 0 = untouched base eyes, 1 = layered reconstruction */
  eyeBlend: number;
  /** eyelid layer alpha */
  lid: number;
  /** head offset, image px */
  head: Vec2;
  /** head sway, radians */
  sway: number;
  /** pendulum display angle, radians (soft-limited) */
  chain: number;
  glints: readonly Glint[];
  /** sweep progress 0..1, −1 = none */
  sweep: number;
};

export const REST_FRAME: CharacterFrame = {
  t: 0,
  breath: 0,
  gaze: [0, 0],
  iris: [0, 0],
  eyeBlend: 0,
  lid: 0,
  head: [0, 0],
  sway: 0,
  chain: 0,
  glints: [],
  sweep: -1,
};

/**
 * The living character as a pure state machine: feed it a gaze target and a
 * time step, read a frame. No DOM, no WebGL – unit tested and deterministic
 * with a seeded RNG (debug captures use that too).
 */
export class CharacterSim {
  t = 0;
  readonly gaze = new Spring2(TUNING.gazeSpring.stiffness, TUNING.gazeSpring.damping);
  readonly headSpring = new Spring2(TUNING.headSpring.stiffness, TUNING.headSpring.damping);
  readonly pendulum = new Pendulum(L.chain.pendulum.stiffness, L.chain.pendulum.damping);
  readonly blinker: Blinker;
  readonly sparkles: Sparkles;
  blinksEnabled = true;

  constructor(rng: Rng, glintPoints: Float32Array) {
    this.blinker = new Blinker(rng);
    this.sparkles = new Sparkles(rng, glintPoints);
  }

  step(dt: number, target: Vec2) {
    this.t += dt;
    this.gaze.step(clamp(target[0], -1, 1), clamp(target[1], -1, 1), dt);
    // eyes never leave their range, whatever the spring overshoot
    this.gaze.x = clamp(this.gaze.x, -1, 1);
    this.gaze.y = clamp(this.gaze.y, -1, 1);
    this.headSpring.step(this.gaze.x, this.gaze.y, dt);
    const headVx = this.headSpring.vx * L.head.follow_gaze_px.x;
    this.pendulum.step(headVx * DERIVED.chainDrive, dt);
    this.sparkles.update(this.t, dt, this.pendulum.omega);
  }

  frame(): CharacterFrame {
    const t = this.t;
    const gaze: Vec2 = [this.gaze.x, this.gaze.y];
    const iris = irisOffset(gaze);
    const blink = this.blinker.value(t, this.blinksEnabled);
    const lid = Math.max(blink, DERIVED.lidDroop * Math.max(gaze[1], 0));
    return {
      t,
      breath: (1 - Math.cos((2 * Math.PI * t) / L.breathing.period_s)) / 2,
      gaze,
      iris,
      eyeBlend: eyeBlend(iris, blink),
      lid,
      head: [this.headSpring.x * L.head.follow_gaze_px.x, this.headSpring.y * L.head.follow_gaze_px.y],
      sway: L.head.sway_rad * Math.sin((2 * Math.PI * t) / L.head.sway_period_s),
      chain: softLimit(this.pendulum.theta, TUNING.chainMaxAngle),
      glints: this.sparkles.glints,
      sweep: this.sparkles.sweep(t),
    };
  }
}

/**
 * Warp displacement D at destination point p (image px): the renderer samples
 * the composited image at p − D(p). Mirrors the fragment shader, so tests can
 * check rest = identity and the pendant swing size. `chainMask` is the
 * (dilated) diamond mask value at p.
 */
export function warpDisplacement([x, y]: Vec2, f: CharacterFrame, chainMask: number): Vec2 {
  const B = L.breathing;
  const H = L.head;
  const C = L.chain;
  let dx = 0;
  let dy = 0;

  // breathing: lift from the chest up, slight chest widening
  dy -= B.lift_px * f.breath * smoothstep(EYES.image[1], DERIVED.liftFullY, y);
  const chest = Math.exp(-((y - B.chest_center_y) ** 2) / (2 * B.chest_sigma ** 2));
  dx += (x - H.center[0]) * B.chest_expand * f.breath * chest;

  // head: follows the gaze, slow sway around the neck
  const e = ((x - H.center[0]) / H.radius[0]) ** 2 + ((y - H.center[1]) / H.radius[1]) ** 2;
  const wHead = (1 - smoothstep(0.55, 1, e)) * (1 - smoothstep(H.fade_to_neck_y[0], H.fade_to_neck_y[1], y));
  dx += wHead * (f.head[0] - f.sway * (y - TUNING.swayPivotY));
  dy += wHead * (f.head[1] + f.sway * (x - H.center[0]));

  // chain: pendulum around the pivot, fading in below the attachment
  const wChain = chainMask * smoothstep(C.attach_fade_y[0], C.attach_fade_y[1], y);
  dx += wChain * f.chain * (y - C.pivot[1]);
  dy -= wChain * f.chain * (x - C.pivot[0]) * C.vertical_factor;

  return [dx, dy];
}
