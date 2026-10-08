/**
 * The intro ("Przebudzenie") ↔ the character engine. The intro directs
 * (develop, eyes held closed, watchdog on hold); the engine reports how far
 * its textures have loaded. Works in any order: the engine reads the current
 * direction when it starts, the intro reads the current load state when it
 * mounts.
 */

/** The character's layers in /character/, loaded with its base (components/character/assets.ts). */
export const CHARACTER_LAYERS = [
  "base-no-iris.jpg",
  "iris-L.png",
  "iris-R.png",
  "highlight-L.png",
  "highlight-R.png",
  "mask-L.png",
  "mask-R.png",
  "blink-lids.png",
  "diamond-mask.png",
] as const;

/** Files the character loads (base + layers); the intro's progress line counts them. */
export const CHARACTER_FILES = CHARACTER_LAYERS.length + 1;

/** A development running from `at` (performance.now() ms) for `ms`. */
export type Development = { at: number; ms: number };

export type StageDirection = {
  /**
   * 0 = black, 1 = normal; the character develops from black like a darkroom
   * print. A Development is resolved by the engine every frame (no second loop).
   */
  develop: number | Development;
  /** eyes held closed (blink-lids layer); false opens them with a blink's opening part */
  lidsHeld: boolean;
  /** the intro is running: the FPS watchdog doesn't measure (the intro must never trip it) */
  hold: boolean;
  /**
   * The intro moved on without the living character (it wasn't ready in
   * time): the engine finishes its setup (texture upload, first frame) only
   * after the intro, so those frames don't land in its animations.
   */
  defer: boolean;
};

export type StageLoad = {
  /** "poster": no living character this time (no WebGL, reduced motion, slow device, error) */
  status: "waiting" | "loading" | "live" | "poster";
  loaded: number;
  total: number;
};

/** Develop amount 0..1 at `now` (ms, performance.now() clock). */
export function developAt(d: StageDirection["develop"], now: number): number {
  if (typeof d === "number") return d;
  if (d.ms <= 0) return 1;
  return Math.min(1, Math.max(0, (now - d.at) / d.ms));
}

export const REST_DIRECTION: StageDirection = { develop: 1, lidsHeld: false, hold: false, defer: false };

export function createStage() {
  let direction: StageDirection = REST_DIRECTION;
  let load: StageLoad = { status: "waiting", loaded: 0, total: 0 };
  const directionListeners = new Set<(d: StageDirection) => void>();
  const loadListeners = new Set<(l: StageLoad) => void>();

  return {
    direction: () => direction,
    direct(next: Partial<StageDirection>) {
      direction = { ...direction, ...next };
      directionListeners.forEach((fn) => fn(direction));
    },
    onDirection(fn: (d: StageDirection) => void): () => void {
      directionListeners.add(fn);
      return () => void directionListeners.delete(fn);
    },
    /** Resolves once the direction satisfies `test` (at once when it already does). */
    until(test: (d: StageDirection) => boolean): Promise<void> {
      if (test(direction)) return Promise.resolve();
      return new Promise((resolve) => {
        const off = this.onDirection((d) => {
          if (!test(d)) return;
          off();
          resolve();
        });
      });
    },
    /** Resolves once the intro doesn't defer the engine (at once when it doesn't). */
    undeferred(): Promise<void> {
      return this.until((d) => !d.defer);
    },

    load: () => load,
    report(next: Partial<StageLoad>) {
      // a final state stays final (a late progress event can't revive a fallback)
      if (load.status === "poster" && next.status !== "live") return;
      load = { ...load, ...next };
      loadListeners.forEach((fn) => fn(load));
    },
    onLoad(fn: (l: StageLoad) => void): () => void {
      loadListeners.add(fn);
      return () => void loadListeners.delete(fn);
    },
  };
}

export type Stage = ReturnType<typeof createStage>;

export const characterStage: Stage = createStage();
