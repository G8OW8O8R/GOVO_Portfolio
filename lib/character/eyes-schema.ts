import { z } from "zod";

/**
 * Shape of public/character/eyes.json (pixels of the 2752×1536 base image).
 * Checked in the unit tests and by next.config.ts, so `next build` fails on
 * a broken file; the browser only uses the type.
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

export const eyesSchema = z.object({
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
    }),
  }),
});

export type Eyes = z.infer<typeof eyesSchema>;
