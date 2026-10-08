/**
 * Frame-rate watchdog: reports "slow" when the median frame time over the
 * last `windowMs` of continuous rendering stays above `budgetMs` (≈ 40 fps).
 *
 * Only continuous measuring windows count. A pause in rendering is not a
 * slow frame: the engine resets the watchdog when it stops its loop (hidden
 * tab, off screen, printing), and a single gap between frames longer than
 * `gapMs` (print dialog, frozen tab, debugger, a long main-thread block)
 * starts the measurement over. Before this, one such gap evicted every
 * frame of the window and became the whole median ("slow" after Print).
 * Several gaps in a row are a device that can't render at all: slow.
 * The first `warmupMs` after a (re)start are ignored (texture upload, wake-up).
 */
export class FpsWatchdog {
  private frames: { at: number; dt: number }[] = [];
  private since = 0;
  private gaps = 0;

  constructor(
    private readonly budgetMs = 25,
    private readonly windowMs = 3000,
    private readonly warmupMs = 1000,
    private readonly gapMs = 250,
    private readonly gapsInARow = 3,
  ) {}

  /** Call when rendering (re)starts after a pause. */
  reset(now: number) {
    this.frames = [];
    this.since = now;
    this.gaps = 0;
  }

  /** `now` and `dt` in ms. Returns true when the device is too slow. */
  push(now: number, dt: number): boolean {
    if (dt > this.gapMs) {
      const gaps = this.gaps + 1;
      this.reset(now);
      this.gaps = gaps;
      return gaps >= this.gapsInARow;
    }
    this.gaps = 0;
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
