/**
 * Frame-rate watchdog: reports "slow" when the median frame time over the
 * last `windowMs` stays above `budgetMs` (≈ 40 fps). The first `warmupMs`
 * after a (re)start are ignored: texture upload and tab wake-up hitch.
 */
export class FpsWatchdog {
  private frames: { at: number; dt: number }[] = [];
  private since = 0;

  constructor(
    private readonly budgetMs = 25,
    private readonly windowMs = 3000,
    private readonly warmupMs = 1000,
  ) {}

  /** Call after a pause (hidden tab, off screen): gaps are not slow frames. */
  reset(now: number) {
    this.frames = [];
    this.since = now;
  }

  /** `now` and `dt` in ms. Returns true when the device is too slow. */
  push(now: number, dt: number): boolean {
    if (now - this.since < this.warmupMs) return false;
    this.frames.push({ at: now, dt });
    while (this.frames.length && now - this.frames[0].at > this.windowMs) this.frames.shift();
    if (now - this.since < this.warmupMs + this.windowMs) return false;
    return this.median() > this.budgetMs;
  }

  median(): number {
    if (!this.frames.length) return 0;
    const sorted = this.frames.map((f) => f.dt).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }
}
