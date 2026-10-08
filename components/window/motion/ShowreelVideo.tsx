"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useWindowVideo } from "./useWindowVideo";

/**
 * The case study showreel: muted, looping, inline, nothing
 * loaded before it nears the view. It plays while in view and pauses outside
 * it, on a hidden page and when the window closes (useWindowVideo). The frame
 * has the video's own aspect ratio, so there are no bars; the optimised poster
 * sits under the video until a frame plays. The whole frame is the play/pause
 * button (WCAG 2.2.2) with a small state chip in the corner for touch; with
 * reduced motion it starts paused.
 */
export function ShowreelVideo({
  src,
  poster,
  width,
  height,
  labels,
  className = "",
}: {
  src: string;
  poster: string;
  width: number;
  height: number;
  labels: { play: string; pause: string };
  className?: string;
}) {
  const { video, playing, onPlaying, paused, toggle } = useWindowVideo(true, 0.35);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={paused ? labels.play : labels.pause}
      data-cursor={paused ? "play" : "pause"}
      style={{ aspectRatio: `${width} / ${height}` }}
      className={`relative block w-full cursor-pointer overflow-hidden rounded-[14px] bg-[#16181c] ${className}`}
    >
      <Image src={poster} alt="" fill sizes="(max-width: 767px) 92vw, 860px" className="object-cover" />
      <video
        ref={video}
        src={src}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        onPlaying={onPlaying}
        className={`absolute inset-0 size-full object-cover transition-opacity duration-[400ms] ease-out ${playing ? "opacity-100" : "opacity-0"}`}
      />
      <span
        aria-hidden="true"
        className="absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-full bg-black/55 text-white desk:bottom-4 desk:left-4"
      >
        {paused ? <Play className="size-4 translate-x-px" fill="currentColor" /> : <Pause className="size-4" fill="currentColor" />}
      </span>
    </button>
  );
}
