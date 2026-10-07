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
