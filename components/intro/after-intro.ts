import { currentIntro } from "@/lib/intro";

type Cancel = () => void;

/**
 * Runs `run` once the intro is over (at once when there is none: reduced
 * motion, bots, or it already ended). `maxWaitMs`: run anyway after this long
 * (pages without the desktop have no intro to end). Returns the canceller.
 */
export function afterIntro(run: () => void, maxWaitMs?: number): Cancel {
  const html = document.documentElement;
  const mode = currentIntro();
  if (mode === "none" || mode === "fade" || html.hasAttribute("data-intro-done")) {
    run();
    return () => {};
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    if (!html.hasAttribute("data-intro-done")) return;
    cancel();
    run();
  });
  const cancel = () => {
    observer.disconnect();
    clearTimeout(timer);
  };
  observer.observe(html, { attributes: true, attributeFilter: ["data-intro-done"] });
  if (maxWaitMs !== undefined) {
    timer = setTimeout(() => {
      cancel();
      run();
    }, maxWaitMs);
  }
  return cancel;
}

/** After the intro, the character gets this long to swap in its full base. */
const CHARACTER_GRACE_MS = 3000;

/** Runs `run` once the character has its full base (`character:full`), or after the grace period. */
function afterCharacter(run: () => void): Cancel {
  if (performance.getEntriesByName("character:full").length) {
    run();
    return () => {};
  }
  const observer = new PerformanceObserver((list) => {
    if (!list.getEntriesByName("character:full").length) return;
    cancel();
    run();
  });
  const timer = setTimeout(() => {
    cancel();
    run();
  }, CHARACTER_GRACE_MS);
  const cancel = () => {
    clearTimeout(timer);
    observer.disconnect();
  };
  observer.observe({ type: "mark" });
  return cancel;
}

/**
 * Runs `run` in an idle moment once the start is over – the intro, then the
 * character's full base (or a grace period) – so nothing optional competes
 * with them. `maxIntroWaitMs` as in afterIntro. Returns the canceller.
 */
export function afterStart(run: () => void, { idleTimeoutMs = 2000, maxIntroWaitMs }: { idleTimeoutMs?: number; maxIntroWaitMs?: number } = {}): Cancel {
  let cancelNext: Cancel = () => {};
  const cancelIntro = afterIntro(() => {
    cancelNext = afterCharacter(() => {
      cancelNext = idle(run, idleTimeoutMs);
    });
  }, maxIntroWaitMs);
  return () => {
    cancelIntro();
    cancelNext();
  };
}

let pageStarted = false;
let waiting: Set<() => void> | null = null;

/**
 * afterStart shared by the whole page: the first call (the desktop mounting)
 * starts the wait, later calls join it, and once the start is over `run` runs
 * at once – a window opened minutes later doesn't wait for a grace period again.
 */
export function whenStarted(run: () => void): Cancel {
  if (pageStarted) {
    run();
    return () => {};
  }
  if (!waiting) {
    const queue = (waiting = new Set());
    afterStart(() => {
      pageStarted = true;
      waiting = null;
      queue.forEach((fn) => fn());
    });
  }
  waiting.add(run);
  return () => void waiting?.delete(run);
}

/** requestIdleCallback with a deadline (a short timeout where it doesn't exist). */
export function idle(run: () => void, timeout: number): Cancel {
  if ("requestIdleCallback" in window) {
    const id = requestIdleCallback(run, { timeout });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(run, 200);
  return () => clearTimeout(id);
}
