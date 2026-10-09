"use client";

import { useEffect, useRef, useState } from "react";
import { useOpenWindowKey } from "@/components/window/store";
import { DESKTOP_MEDIA } from "@/lib/character-box";
import { characterStage } from "@/lib/character/stage";
import { currentIntro } from "@/lib/intro";
import { CharacterEngine, LEGACY_FALLBACK_KEY, isSlowDevice, webgl2Supported } from "./engine";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * WebGL canvas over the static poster. The poster (base.jpg) stays the
 * fallback: no WebGL2, reduced motion, slow device (watchdog, for the life
 * of the page), and while a lost WebGL context comes back.
 * The canvas fades in only after its first frame is drawn.
 * On phones an open window is a full-screen sheet over the character: the
 * engine doesn't start under it, pauses while one is open and goes on once it closes.
 */
export function LiveCharacter({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const windowOpen = useOpenWindowKey() !== null;
  const covered = useRef(false);
  const engineRef = useRef<{ engine: CharacterEngine; begin: () => void } | null>(null);

  // declared first: the engine effect below reads `covered` on mount
  useEffect(() => {
    const desktop = matchMedia(DESKTOP_MEDIA);
    const sync = () => {
      covered.current = windowOpen && !desktop.matches;
      engineRef.current?.engine.setCovered(covered.current);
      if (!covered.current) engineRef.current?.begin();
    };
    sync();
    desktop.addEventListener("change", sync);
    return () => desktop.removeEventListener("change", sync);
  }, [windowOpen]);

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
    const noLife = () => characterStage.report({ status: "poster" });
    if (params.get("character") === "off") return noLife();
    if (matchMedia(REDUCED_MOTION).matches) return noLife();
    if (!debug && isSlowDevice()) return noLife();
    if (!webgl2Supported()) return noLife();

    const seed = params.get("seed");
    const fullIntro = currentIntro() === "full";
    const engine = new CharacterEngine({
      canvas,
      poster,
      debug,
      seed: seed ? Number(seed) : undefined,
      forceBase: params.get("base") === "full" || params.get("base") === "crop" ? (params.get("base") as "full" | "crop") : undefined,
      // the full intro: start from the poster so the character develops in time (debug: always full resolution)
      quick: fullIntro && !debug,
      onLive: setLive,
      onFallback: () => setLive(false),
    });

    // Let the poster (LCP) load first, then fetch the originals when idle.
    // The full intro waits for the textures behind its overlay: start at once
    // (in the next task, so a dev re-mount cancels it before it takes the context).
    // Under a phone's window sheet it waits until the sheet closes.
    let started = false;
    let wanted = false;
    const begin = () => {
      wanted = true;
      if (started || covered.current) return;
      started = true;
      void engine.start();
    };
    const idle = () =>
      "requestIdleCallback" in window ? requestIdleCallback(begin, { timeout: 1500 }) : setTimeout(begin, 200);
    engineRef.current = { engine, begin: () => wanted && begin() };
    if (fullIntro) setTimeout(begin);
    else if (poster.complete) idle();
    else poster.addEventListener("load", idle, { once: true });

    return () => {
      poster.removeEventListener("load", idle);
      started = true;
      engineRef.current = null;
      engine.destroy();
    };
  }, []);

  return <canvas ref={ref} className={className} data-live={live || undefined} aria-hidden="true" />;
}
