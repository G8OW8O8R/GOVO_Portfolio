"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { DESKTOP_MEDIA } from "@/lib/character-box";
import { VIEWER, characterGaze } from "@/lib/character/look-at";
import { CHARACTER_FILES, REST_DIRECTION, characterStage } from "@/lib/character/stage";
import { INTRO_SEEN_KEY, SKIP_EVENTS, currentIntro, fitTail, fullTimeline, loadProgress, shortTimeline } from "@/lib/intro";
import { cssBezier, EASE_OUT } from "@/lib/motion-tokens";

/** Skipping: everything lands in its final state this fast. */
const SKIP_MS = 160;

type Props = {
  files: number;
  overlayClass: string;
  centerClass: string;
  lineClass: string;
  barClass: string;
  children: ReactNode;
};

/** A run survives React's dev double mount: the cleanup only finalises when no new run follows. */
let runId = 0;

/**
 * Executes the intro chosen by the head script (lib/intro.ts). The short
 * version runs in CSS from the first paint; the director only lets it go.
 * The full version is directed here: real loading → flash → development →
 * eyes open → files drop. Timers and Web Animations only, no own frame loop;
 * the character's development and eyes run in its engine (lib/character/stage.ts).
 */
export function IntroDirector({ files, overlayClass, centerClass, lineClass, barClass, children }: Props) {
  const overlay = useRef<HTMLDivElement>(null);
  const center = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const mode = currentIntro();
    if (mode === "fade" || mode === "none" || html.hasAttribute("data-intro-done")) return;
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {}
    const phone = !matchMedia(DESKTOP_MEDIA).matches;
    const id = ++runId;
    const stop =
      mode === "full"
        ? runFull({ overlay: overlay.current!, center: center.current!, bar: bar.current!, files, phone })
        : runShort(phone);
    return () => {
      const finalize = stop();
      setTimeout(() => runId === id && finalize());
    };
  }, [files]);

  return (
    <div ref={overlay} className={overlayClass} aria-hidden="true" data-intro-overlay="">
      <div ref={center} className={centerClass}>
        {children}
        <span className={lineClass}>
          <span ref={bar} className={barClass} />
        </span>
      </div>
    </div>
  );
}

const done = () => {
  const html = document.documentElement;
  html.setAttribute("data-intro-files", "");
  html.setAttribute("data-intro-late", "");
  html.setAttribute("data-intro-done", "");
  html.removeAttribute("data-intro-run");
};

/** Listens for a skip (also one that came before hydration – the head script marks it); returns the remover. */
function onSkip(fn: () => void): () => void {
  if (document.documentElement.hasAttribute("data-intro-skip")) {
    queueMicrotask(fn);
    return () => {};
  }
  const opts = { capture: true, passive: true } as const;
  SKIP_EVENTS.forEach((e) => addEventListener(e, fn, opts));
  return () => SKIP_EVENTS.forEach((e) => removeEventListener(e, fn, opts));
}

/** Repeat visit / window address: CSS plays the flash and the fade; mark the end. */
function runShort(phone: boolean): () => () => void {
  const t = shortTimeline({ phone });
  const timer = setTimeout(done, Math.max(0, t.total - performance.now()) + 40);
  const offSkip = onSkip(() => {
    clearTimeout(timer);
    done();
  });
  return () => {
    clearTimeout(timer);
    offSkip();
    return done;
  };
}

function runFull({
  overlay,
  center,
  bar,
  files,
  phone,
}: {
  overlay: HTMLElement;
  center: HTMLElement;
  bar: HTMLElement;
  files: number;
  phone: boolean;
}): () => () => void {
  const html = document.documentElement;
  html.setAttribute("data-intro-run", "");
  const plan = fullTimeline({ phone, files });
  let t = plan;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const anims: Animation[] = [];
  let dark: Animation | null = null;
  const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, Math.max(0, ms)));
  let releaseLook: (() => void) | null = characterGaze.lookAt(VIEWER);
  const release = () => {
    releaseLook?.();
    releaseLook = null;
  };
  // the character develops from black with its eyes closed; the watchdog waits
  characterStage.direct({ develop: 0, lidsHeld: true, hold: true });

  // ---------- 1. real loading: poster, fonts, file icons, the character's textures ----------
  const poster = document.querySelector<HTMLImageElement>("img[data-character-poster]");
  // downloaded and decoded – not decoded in the frame the dark starts lifting
  let posterIn = !poster;
  let fontsIn = false;
  // file icons decoded now, so they don't decode in the middle of their drop
  const iconImages = [...document.querySelectorAll<HTMLImageElement>('[data-intro-drop=""] img')];
  let iconsIn = 0;
  let started = false;
  let finished = false;

  const update = () => {
    if (started) return;
    const load = characterStage.load();
    const textures = load.status === "poster" ? null : { loaded: load.loaded, total: load.total || CHARACTER_FILES };
    const icons = { loaded: iconsIn, total: iconImages.length };
    bar.style.transform = `scaleX(${loadProgress({ poster: posterIn, fonts: fontsIn, icons, textures }).toFixed(3)})`;
    const settled = load.status === "live" || load.status === "poster";
    if (posterIn && fontsIn && iconsIn === iconImages.length && settled && performance.now() >= t.draw) go(load.status === "live");
  };
  void poster
    ?.decode()
    .catch(() => {})
    .then(() => {
      posterIn = true;
      update();
    });
  void document.fonts.ready.then(() => {
    fontsIn = true;
    update();
  });
  for (const img of iconImages) {
    // decode() also waits for the download; a broken image counts as done
    void img
      .decode()
      .catch(() => {})
      .then(() => {
        iconsIn++;
        update();
      });
  }
  const offLoad = characterStage.onLoad(update);
  const now = performance.now();
  after(t.draw - now, update);
  // the budget wins: the living character gets until `wait` (the rest then runs a little faster);
  // whatever isn't in by then joins after the intro (poster, then the canvas fades in)
  after(t.wait - now, () => go(characterStage.load().status === "live"));

  // ---------- 2–5 ----------
  /**
   * Starts at the first idle moment (≤ 120 ms): on a slow device the director
   * mounts late, in the middle of hydration's last work, and the flash would
   * start in a heavy frame. fitTail keeps the budget.
   */
  function go(live: boolean) {
    if (started || finished) return;
    started = true;
    const begin = () => !finished && run(live || characterStage.load().status === "live");
    if ("requestIdleCallback" in window) requestIdleCallback(begin, { timeout: 120 });
    else setTimeout(begin);
  }

  function run(live: boolean) {
    offLoad();
    // late (slow hydration): the rest runs faster to stay within the budget
    t = fitTail(plan, performance.now());
    anims.push(center.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-out", fill: "forwards" }));
    // 2. the pendant's diamonds flash and the light spreads over the screen
    const flash = document.querySelector<HTMLElement>("[data-intro-flash]");
    if (flash) {
      anims.push(
        flash.animate(
          [
            { opacity: 0, transform: "scale(0.05)" },
            { opacity: 1, offset: 0.3 },
            { opacity: 0, transform: "scale(5)" },
          ],
          { duration: t.flash, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "forwards" },
        ),
      );
    }
    // 3. the dark lifts while the character develops (eyes still closed, the logo's too)
    overlay.style.pointerEvents = "none";
    dark = overlay.animate([{ opacity: 0.998 }, { opacity: 0 }], {
      duration: t.develop,
      delay: t.developAt,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "forwards",
    });
    if (live) {
      characterStage.direct({ develop: { at: performance.now() + t.developAt, ms: t.develop } });
      // 4. character and logo open their eyes together, look at the visitor, then follow the cursor
      after(t.openAt, () => characterStage.direct({ lidsHeld: false }));
      after(t.openAt + t.look, release);
    } else {
      // no living character in time: the poster shows; the canvas sets up after the intro and arrives normal
      characterStage.direct({ develop: 1, lidsHeld: false, defer: true });
      release();
    }
    // 5. files drop onto their places, then the capsule and the dock
    after(t.dropAt, () => {
      document.querySelectorAll<HTMLElement>('[data-intro-drop=""]').forEach((el, i) => {
        anims.push(
          el.animate(
            [
              { transform: "translateY(-26px)", opacity: 0.001 },
              { transform: "translateY(3px)", opacity: 1, offset: 0.62 },
              { transform: "translateY(-1px)", offset: 0.82 },
              { transform: "none" },
            ],
            { duration: t.drop, delay: i * t.stagger, easing: "cubic-bezier(0.33, 0, 0.3, 1)", fill: "backwards" },
          ),
        );
      });
      html.setAttribute("data-intro-files", "");
    });
    after(t.lateAt, () => {
      document.querySelectorAll<HTMLElement>('[data-intro-drop="late"]').forEach((el) => {
        const from = el.hasAttribute("data-dock") ? 18 : -12;
        anims.push(
          el.animate([{ transform: `translateY(${from}px)`, opacity: 0.001 }, { transform: "none", opacity: 1 }], {
            duration: t.late,
            easing: cssBezier(EASE_OUT),
            fill: "backwards",
          }),
        );
      });
      html.setAttribute("data-intro-late", "");
    });
    after(t.tail, () => finish(false));
  }

  function finish(skip: boolean) {
    if (finished) return;
    finished = true;
    started = true;
    timers.forEach(clearTimeout);
    offLoad();
    offSkip();
    release();
    // eyes open (if still closed), full exposure, the watchdog measures again
    characterStage.direct(REST_DIRECTION);
    if (!skip) return done();
    // skipped: whatever runs jumps to its end, the dark leaves quickly
    anims.forEach((a) => a.finish());
    html.setAttribute("data-intro-files", "");
    html.setAttribute("data-intro-late", "");
    overlay.style.pointerEvents = "none";
    const from = getComputedStyle(overlay).opacity;
    dark?.cancel();
    overlay.animate([{ opacity: from }, { opacity: 0 }], { duration: SKIP_MS, easing: "ease-out", fill: "forwards" });
    setTimeout(done, SKIP_MS);
  }

  const offSkip = onSkip(() => finish(true));

  return () => {
    // unmount (or React's dev re-mount): stop everything; the caller finalises if no new run follows
    const wasFinished = finished;
    finished = true;
    timers.forEach(clearTimeout);
    offLoad();
    offSkip();
    anims.forEach((a) => a.cancel());
    dark?.cancel();
    release();
    characterStage.direct(REST_DIRECTION);
    return () => !wasFinished && done();
  };
}
