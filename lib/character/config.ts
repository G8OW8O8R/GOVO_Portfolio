import { z } from "zod";
import raw from "@/public/character/eyes.json";

/**
 * eyes.json is the source of truth for the living character. It is parsed
 * once here, so a broken asset file fails loudly in tests and at build time.
 * All values are in pixels of the 2752×1536 base image.
 */

const point = z.tuple([z.number(), z.number()]);
const span = z.tuple([z.number(), z.number()]);

const eye = z.object({
  irisCenter: point,
  irisRadius: z.number(),
  spriteOrigin: point,
  spriteSize: z.number(),
  maskOrigin: point,
  maskSize: point,
  range: z.object({ x: span, y: span }),
});

const schema = z.object({
  image: point,
  eyes: z.object({ L: eye, R: eye }),
  blink: z.object({
    origin: point,
    size: point,
    timing_ms: z.object({ close: z.number(), hold: z.number(), open: z.number() }),
    interval_s: span,
  }),
  living: z.object({
    breathing: z.object({
      period_s: z.number(),
      lift_px: z.number(),
      chest_expand: z.number(),
      chest_center_y: z.number(),
      chest_sigma: z.number(),
    }),
    head: z.object({
      center: point,
      radius: point,
      fade_to_neck_y: span,
      follow_gaze_px: z.object({ x: z.number(), y: z.number() }),
      sway_rad: z.number(),
      sway_period_s: z.number(),
    }),
    pendant_sparkles: z.object({
      glint_life_s: z.number(),
      glint_size_px: span,
      sweep: z.object({
        every_s: z.number(),
        duration_s: z.number(),
        angle_deg: z.number(),
        width_px: z.number(),
        strength: z.number(),
      }),
    }),
    chain: z.object({
      maskOrigin: point,
      pivot: point,
      attach_fade_y: span,
      pendulum: z.object({ stiffness: z.number(), damping: z.number() }),
      vertical_factor: z.number(),
    }),
  }),
});

export const EYES = schema.parse(raw);
export type EyeSide = "L" | "R";
export type Vec2 = readonly [number, number];

/**
 * Values eyes.json gives only as prose ("glints_per_s", "drive", "lift_weight",
 * eyelid droop, idle). Kept next to the parsed data so every number has one home.
 */
export const DERIVED = {
  /** glints per second = base + |chain angular velocity (rad/s)| × perOmega */
  glintRate: { base: 2.5, perOmega: 60 },
  /** pendulum drive = head x-velocity (image px/s) × this */
  chainDrive: -0.075,
  /** breathing lift weight: 0 at the image bottom, 1 from this y up */
  liftFullY: 700,
  /** eyelid overlay alpha when looking down: droop × max(gazeY, 0) */
  lidDroop: 0.32,
  /** cursor idle time before the gaze starts wandering */
  idleAfterS: 4,
} as const;

/** Tuning that eyes.json does not specify (chosen and verified on frame captures). */
export const TUNING = {
  /** Gaze spring (eyes.json notes: stiffness ~180, damping ~22). */
  gazeSpring: { stiffness: 180, damping: 22 },
  /** Head trails the gaze ("head lightly follows the gaze"). */
  headSpring: { stiffness: 60, damping: 14 },
  /**
   * Pendulum angle is soft-limited (tanh) to this many radians. A fast glance
   * across the full gaze range swings the OVO pendant (≈300 px below the pivot)
   * by ≈ 20 image px, i.e. 10–15 CSS px at the usual desktop scale (0.56–0.7);
   * repeated glances never push it beyond ≈ 45 image px.
   */
  chainMaxAngle: 0.15,
  /** Sway pivot: base of the neck. */
  swayPivotY: 640,
  /** Cursor distance (image px) at which the gaze reaches ~70% of its range. */
  gazeReach: 700,
  /**
   * The eyes show the untouched base image while the iris offset (after the
   * spring) is below `from` px and the layered reconstruction above `to` px.
   */
  eyeBlend: { from: 0.05, to: 1.2 },
  /** Chain warp weight: diamond mask dilated by this radius (image px). */
  chainMaskBlur: 24,
  maxGlints: 16,
} as const;

/** Midpoint between the irises: the origin for cursor → gaze mapping. */
export const EYE_MIDPOINT: Vec2 = [
  (EYES.eyes.L.irisCenter[0] + EYES.eyes.R.irisCenter[0]) / 2,
  (EYES.eyes.L.irisCenter[1] + EYES.eyes.R.irisCenter[1]) / 2,
];

/** Diamond / chain mask rectangle in image px. */
export const DIAMOND_RECT = {
  x: EYES.living.chain.maskOrigin[0],
  y: EYES.living.chain.maskOrigin[1],
  // diamond-mask.png is 369×418; the size is not in eyes.json, so the
  // renderer reads it from the decoded image and this is the fallback.
  width: 369,
  height: 418,
} as const;
