/**
 * Shared motion: one set of durations, curves and springs for the whole UI
 * (150–400 ms, no bouncy springs without a reason).
 * Motion (JS) uses SPRING; CSS transitions use springCss(), the same spring
 * sampled into a CSS linear() easing.
 */

export const DURATION = { fast: 0.15, base: 0.25, slow: 0.4 } as const;

/** Ease-out for exits and small state changes. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

/** The one UI spring: window enter, full screen, the dock coming back. */
export const SPRING = { type: "spring", visualDuration: 0.38, bounce: 0.06 } as const;
/** Phone sheet: a touch slower, no overshoot. */
export const SHEET_SPRING = { type: "spring", visualDuration: 0.4, bounce: 0 } as const;

/**
 * A spring from 0 to 1 sampled as CSS `linear()` plus its settle time.
 * Same parametrisation as Motion (visualDuration + bounce): damping ratio
 * 1 − bounce, stiffness (2π / (1.2 · visualDuration))², mass 1.
 */
export function springEasing(visualDuration: number, bounce: number, samples = 40): { easing: string; ms: number } {
  const stiffness = ((2 * Math.PI) / (1.2 * visualDuration)) ** 2;
  const damping = 2 * Math.max(0.05, 1 - bounce) * Math.sqrt(stiffness);
  const dt = 1 / 600;
  const rest = 0.001;
  let x = 0;
  let v = 0;
  const trace: number[] = [0];
  // integrate until settled (both position and velocity), max 2 s
  for (let t = dt; t < 2; t += dt) {
    const a = stiffness * (1 - x) - damping * v;
    v += a * dt;
    x += v * dt;
    trace.push(x);
    if (Math.abs(1 - x) < rest && Math.abs(v) < rest * 10) break;
  }
  const n = trace.length - 1;
  const points: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const value = i === samples ? 1 : trace[Math.round((i / samples) * n)];
    points.push(String(Math.round(value * 1000) / 1000));
  }
  return { easing: `linear(${points.join(", ")})`, ms: Math.round(n * dt * 1000) };
}

/** `transform <ms> linear(...)` for CSS, from SPRING. */
export function springCss(property = "transform", spring: { visualDuration: number; bounce: number } = SPRING): string {
  const { easing, ms } = springEasing(spring.visualDuration, spring.bounce);
  return `${property} ${ms}ms ${easing}`;
}

/** A cubic-bezier tuple as a CSS / Web Animations easing string. */
export const cssBezier = (curve: readonly [number, number, number, number]) => `cubic-bezier(${curve.join(", ")})`;

/**
 * Motion inside windows: transform/opacity
 * only (stroke-dashoffset in SVG), 200–600 ms, each effect once per tab
 * opening, all on EASE_OUT. Milliseconds (Web Animations API).
 */
export const CONTENT_MOTION = {
  /** First visit of a tab in the session: crossfade + rise, list items one after another. */
  enter: { ms: 220, shift: 8, stagger: 35, maxItems: 10 },
  /** Tab heading revealed line by line from under a mask. */
  reveal: { ms: 500, stagger: 60 },
  /** Strike-through drawn from the left once the heading is in. */
  draw: { ms: 600 },
  /** Price digits rolling like an odometer. */
  count: { ms: 500 },
  /** Process line growing to the next step, the step number lighting up. */
  segment: { ms: 320 },
  light: { ms: 200 },
  /** Thumbnail tilt towards the cursor. */
  tilt: { ms: 200, maxDeg: 6, lift: 4, perspective: 600 },
} as const;

/**
 * Custom cursor: an 8 px dot on a spring (no overshoot), stretched along
 * the motion while a file is dragged. Stiffness/damping per second².
 */
export const CURSOR = {
  spring: { stiffness: 1400, damping: 75 },
  stretch: { perSpeed: 1 / 1800, max: 0.8 },
  stateMs: 160,
} as const;

/** Live skills: the demo crossfades over its thumbnail; data refreshes every 30 s. */
export const LIVE = { crossfadeMs: 200, refreshMs: 30_000 } as const;
