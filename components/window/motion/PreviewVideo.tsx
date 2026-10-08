"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { REDUCED_MOTION } from "../ghost";
import { observeInWindow, prefersReducedMotion, useWindowScroller } from "./shared";

const subscribeReduced = (fn: () => void) => {
  const q = matchMedia(REDUCED_MOTION);
  q.addEventListener("change", fn);
  return () => q.removeEventListener("change", fn);
};

const FRAME = "relative block aspect-[1280/634] overflow-hidden rounded-[10px] bg-white/5 shadow-[0_20px_50px_rgb(0_0_0/0.5)]";

/**
 * A project cover that turns into its preview loop once it is in view:
 * muted, looping, inline, nothing loaded before (preload="none"). Plays only
 * while visible in the window and on a visible page; pauses when it scrolls
 * out, its tab closes (the panel hides, so it leaves the view) or the window
 * closes (unmount). The video fades in over the cover once it really plays.
 * Reduced motion: the cover stays.
 *
 * With `labels` (project window) the frame is a play/pause button
 * (WCAG 2.2.2) whose cursor reads "Play" / "Pause"; with reduced motion it
 * starts paused and plays only when asked.
 */
export function PreviewVideo({
  slug,
  sizes,
  className = FRAME,
  labels,
}: {
  slug: string;
  sizes: string;
  className?: string;
  labels?: { play: string; pause: string };
}) {
  const scroller = useWindowScroller();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggleable = !!labels;
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
    const sync = () => {
      if (inView && !pausedRef.current && document.visibilityState === "visible") v.play().catch(() => {});
      else v.pause();
    };
    syncRef.current = sync;
    const stop = observeInWindow(
      v,
      scroller?.current ?? null,
      (visible) => {
        inView = visible;
        sync();
      },
      { threshold: 0.25 },
    );
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", sync);
      v.pause();
    };
  }, [scroller, toggleable]);

  const toggle = () => setChoice(!paused);

  const media = (
    <>
      <Image src={`/projects/${slug}/cover.jpg`} alt="" fill sizes={sizes} className="object-cover" />
      <video
        ref={video}
        src={`/projects/${slug}/preview.mp4`}
        poster={`/projects/${slug}/preview-poster.jpg`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
        className={`absolute inset-0 size-full object-cover transition-opacity duration-[400ms] ease-out ${playing ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );

  if (!labels) {
    return (
      <span className={className}>
        {media}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={paused ? labels.play : labels.pause}
      data-cursor={paused ? "play" : "pause"}
      className={`${className} cursor-pointer`}
    >
      {media}
    </button>
  );
}
