"use client";

import { useEffect, useRef, useState } from "react";
import { CharacterEngine, LEGACY_FALLBACK_KEY, isSlowDevice, webgl2Supported } from "./engine";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * WebGL canvas over the static poster. The poster (base.jpg) stays the
 * fallback: no WebGL2, reduced motion, slow device (watchdog, for the life
 * of the page), and while a lost WebGL context comes back.
 * The canvas fades in only after its first frame is drawn.
 */
export function LiveCharacter({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    const poster = canvas?.parentElement?.querySelector<HTMLImageElement>("img[data-character-poster]");
    if (!canvas || !poster) return;
    // the "slow" decision used to live in sessionStorage and kept the poster after a reload
    try {
      sessionStorage.removeItem(LEGACY_FALLBACK_KEY);
    } catch {}
    // ?character=debug|off and ?seed= exist only in development; production ignores them
    const params = new URLSearchParams(process.env.NODE_ENV !== "production" ? location.search : "");
    const debug = params.get("character") === "debug";
    if (params.get("character") === "off") return;
    if (matchMedia(REDUCED_MOTION).matches) return;
    if (!debug && isSlowDevice()) return;
    if (!webgl2Supported()) return;

    const seed = params.get("seed");
    const engine = new CharacterEngine({
      canvas,
      poster,
      debug,
      seed: seed ? Number(seed) : undefined,
      forceBase: params.get("base") === "full" || params.get("base") === "crop" ? (params.get("base") as "full" | "crop") : undefined,
      onLive: setLive,
      onFallback: () => setLive(false),
    });

    // Let the poster (LCP) load first, then fetch the originals when idle.
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      void engine.start();
    };
    const idle = () =>
      "requestIdleCallback" in window ? requestIdleCallback(begin, { timeout: 1500 }) : setTimeout(begin, 200);
    if (poster.complete) idle();
    else poster.addEventListener("load", idle, { once: true });

    return () => {
      poster.removeEventListener("load", idle);
      started = true;
      engine.destroy();
    };
  }, []);

  return <canvas ref={ref} className={className} data-live={live || undefined} aria-hidden="true" />;
}
