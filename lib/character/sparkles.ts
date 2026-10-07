import { DERIVED, EYES, TUNING } from "./config";
import { between, type Rng } from "./motion";

const P = EYES.living.pendant_sparkles;

export type Glint = {
  /** image px */
  x: number;
  y: number;
  /** full ray length, image px */
  size: number;
  born: number;
  /** ray rotation, radians */
  rot: number;
  /** 0..1, picks the dispersion tint */
  hue: number;
};

/** Glint brightness envelope over its life: quick rise, slower fade. */
export function glintEnvelope(age: number, life: number = P.glint_life_s): number {
  if (age <= 0 || age >= life) return 0;
  const t = age / life;
  return Math.sin(Math.PI * Math.pow(t, 0.6));
}

/**
 * Sparkles on the diamonds: point glints spawned at
 * 2.5 + |chain angular velocity| × 60 per second, and a light sweep across
 * the pendant every 3.5 s (or on demand: flash()).
 */
export class Sparkles {
  glints: Glint[] = [];
  private acc = 0;
  private flashAt = -Infinity;

  /** `points`: candidate glint centres [x0, y0, x1, y1, …] in image px. */
  constructor(
    private readonly rng: Rng,
    private readonly points: Float32Array,
  ) {}

  flash(now: number) {
    this.flashAt = now;
  }

  update(now: number, dt: number, chainOmega: number) {
    this.glints = this.glints.filter((g) => now - g.born < P.glint_life_s);
    const count = this.points.length / 2;
    if (count === 0) return;
    this.acc += (DERIVED.glintRate.base + Math.abs(chainOmega) * DERIVED.glintRate.perOmega) * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      if (this.glints.length >= TUNING.maxGlints) continue;
      const i = Math.floor(this.rng() * count);
      this.glints.push({
        x: this.points[i * 2],
        y: this.points[i * 2 + 1],
        size: between(this.rng, P.glint_size_px),
        born: now,
        rot: (this.rng() - 0.5) * 0.5,
        hue: this.rng(),
      });
    }
  }

  /**
   * Sweep progress 0..1 while a sweep runs, otherwise -1. Periodic sweeps
   * start one period after t = 0, so the first frame is untouched.
   */
  sweep(now: number): number {
    const { every_s, duration_s } = P.sweep;
    const sinceFlash = now - this.flashAt;
    if (sinceFlash >= 0 && sinceFlash < duration_s) return sinceFlash / duration_s;
    if (now < every_s) return -1;
    const phase = (now - every_s) % every_s;
    return phase < duration_s ? phase / duration_s : -1;
  }
}
