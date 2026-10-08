"use client";

import type { ImageSet } from "@/lib/images";
import { Picture } from "@/components/ui/Picture";
import { useWindowVideo } from "./useWindowVideo";

const FRAME = "relative block aspect-[1280/634] overflow-hidden rounded-[10px] bg-white/5 shadow-[0_20px_50px_rgb(0_0_0/0.5)]";

/**
 * A project cover that turns into its preview loop once it is in view
 * (Pricing): muted, looping, inline, nothing loaded before (preload="none").
 * Playback follows the window (useWindowVideo); the video fades in over the
 * cover once it really plays, so it needs no poster of its own (that one
 * downloaded with the window even on a hidden tab). Reduced motion: the cover stays.
 */
export function PreviewVideo({ slug, cover, className = FRAME }: { slug: string; cover: ImageSet; className?: string }) {
  const { video, playing, onPlaying } = useWindowVideo(false);
  return (
    <span className={className}>
      <Picture image={cover} className="absolute inset-0" />
      <video
        ref={video}
        src={`/projects/${slug}/preview.mp4`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        onPlaying={onPlaying}
        className={`absolute inset-0 size-full object-cover transition-opacity duration-[400ms] ease-out ${playing ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
