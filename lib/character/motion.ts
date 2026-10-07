/** Small numeric helpers shared by the character simulation and its tests. */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** GLSL smoothstep; works with edge0 > edge1 (reversed ramp) like the shader. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export type Rng = () => number;

export const between = (rng: Rng, [lo, hi]: readonly [number, number]) => lo + (hi - lo) * rng();

/** Deterministic PRNG for tests and debug captures (mulberry32). */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Damped spring in 2D (unit mass), integrated with semi-implicit Euler substeps. */
export class Spring2 {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;

  constructor(
    private readonly stiffness: number,
    private readonly damping: number,
  ) {}

  step(tx: number, ty: number, dt: number) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.vx += (this.stiffness * (tx - this.x) - this.damping * this.vx) * h;
      this.vy += (this.stiffness * (ty - this.y) - this.damping * this.vy) * h;
      this.x += this.vx * h;
      this.y += this.vy * h;
    }
  }

  snap(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }
}

/** θ'' = −k·θ − c·θ' + drive (angle in radians). */
export class Pendulum {
  theta = 0;
  omega = 0;

  constructor(
    private readonly stiffness: number,
    private readonly damping: number,
  ) {}

  step(drive: number, dt: number) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.omega += (-this.stiffness * this.theta - this.damping * this.omega + drive) * h;
      this.theta += this.omega * h;
    }
  }

  reset() {
    this.theta = 0;
    this.omega = 0;
  }
}

/** Soft limit: linear around 0, never beyond ±max. */
export const softLimit = (v: number, max: number) => max * Math.tanh(v / max);
