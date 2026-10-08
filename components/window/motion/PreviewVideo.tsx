"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { observeInWindow, prefersReducedMotion, useWindowScroller } from "./shared";

/**
 * A project cover that turns into its preview loop once it is in view:
 * muted, looping, inline, nothing loaded before (preload="none"). Plays only
 * while visible in the window and on a visible page; pauses when it scrolls
 * out, its tab closes (the panel hides, so it leaves the view) or the window
 * closes (unmount). The video fades in over the cover once it really plays.
 * Reduced motion: the cover stays.
 */
export function PreviewVideo({ slug, sizes }: { slug: string; sizes: string }) {
  const scroller = useWindowScroller();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v || prefersReducedMotion()) return;
    let inView = false;
    const sync = () => {
      if (inView && document.visibilityState === "visible") v.play().catch(() => {});
      else v.pause();
    };
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
  }, [scroller]);

  return (
    <span className="relative block aspect-[1280/634] overflow-hidden rounded-[10px] bg-white/5 shadow-[0_20px_50px_rgb(0_0_0/0.5)]">
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
    </span>
  );
}
