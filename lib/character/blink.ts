import { EYES } from "./config";
import { between, smoothstep, type Rng } from "./motion";

const { close, hold, open } = EYES.blink.timing_ms;
const CLOSE = close / 1000;
const HOLD = hold / 1000;
const OPEN = open / 1000;
export const BLINK_DURATION = CLOSE + HOLD + OPEN;

/** Eyelid coverage (0 open … 1 closed) `s` seconds into a blink. */
export function blinkCurve(s: number): number {
  if (s <= 0 || s >= BLINK_DURATION) return 0;
  if (s < CLOSE) return smoothstep(0, CLOSE, s);
  if (s < CLOSE + HOLD) return 1;
  return 1 - smoothstep(CLOSE + HOLD, BLINK_DURATION, s);
}

/** Random blinks every 3–7 s (eyes.json blink.interval_s). */
export class Blinker {
  private start = -Infinity;
  private next: number;

  constructor(
    private readonly rng: Rng,
    now = 0,
  ) {
    this.next = now + between(rng, EYES.blink.interval_s);
  }

  /** Start a blink now (debug). */
  trigger(now: number) {
    this.start = now;
    this.next = now + BLINK_DURATION + between(this.rng, EYES.blink.interval_s);
  }

  /** Play only the opening part of a blink, starting now (eyes held closed until now – the intro). */
  openFrom(now: number) {
    this.start = now - CLOSE - HOLD;
    this.next = now + OPEN + between(this.rng, EYES.blink.interval_s);
  }

  /** `auto` = random blinks on; triggered blinks always play. */
  value(now: number, auto = true): number {
    if (auto && now >= this.next) this.trigger(this.next);
    return blinkCurve(now - this.start);
  }
}
