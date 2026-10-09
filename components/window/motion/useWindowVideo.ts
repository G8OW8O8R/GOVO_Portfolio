"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { whenStarted } from "@/components/intro/after-intro";
import { REDUCED_MOTION } from "../ghost";
import { observeInWindow, prefersReducedMotion, useWindowScroller } from "./shared";

const subscribeReduced = (fn: () => void) => {
  const q = matchMedia(REDUCED_MOTION);
  q.addEventListener("change", fn);
  return () => q.removeEventListener("change", fn);
};

/**
 * A muted video inside a window that plays only while it is in view of the
 * window scroller and the page is visible; it pauses when it scrolls out,
 * its tab hides (the panel leaves the view), the page is hidden or the window
 * closes (unmount). Nothing is loaded before (preload="none" on the element).
 *
 * `toggleable`: the visitor can pause and resume it (WCAG 2.2.2); with
 * reduced motion it starts paused and plays only when asked. Without it,
 * reduced motion keeps the video stopped (the cover stays).
 * `playing` turns true once a frame really plays (fade the video in then).
 */
export function useWindowVideo(toggleable: boolean, threshold = 0.25) {
  const scroller = useWindowScroller();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduced, prefersReducedMotion, () => false);
  // the visitor's choice; until then reduced motion means paused
  const [choice, setChoice] = useState<boolean | null>(null);
  const paused = choice ?? (toggleable && reduced);
  const pausedRef = useRef(paused);
  const syncRef = useRef(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current();
  }, [paused]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (prefersReducedMotion() && !toggleable) return;
    let inView = false;
    // a window opened at its own address plays once the page has started
    // (intro, character, an idle moment): the player and its download stay out
    // of the first paint, the poster shows meanwhile; later windows play at once
    let started = false;
    const sync = () => {
      if (started && inView && !pausedRef.current && document.visibilityState === "visible") v.play().catch(() => {});
      else v.pause();
    };
    const cancelStart = whenStarted(() => {
      started = true;
      sync();
    });
    syncRef.current = sync;
    const stop = observeInWindow(
      v,
      scroller?.current ?? null,
      (visible) => {
        inView = visible;
        sync();
      },
      { threshold },
    );
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      cancelStart();
      document.removeEventListener("visibilitychange", sync);
      v.pause();
    };
  }, [scroller, toggleable, threshold]);

  return {
    video,
    playing,
    onPlaying: () => setPlaying(true),
    paused,
    toggle: () => setChoice(!paused),
  };
}
