"use client";

import { lazy, Suspense, useRef } from "react";
import type { ImageSet } from "@/lib/images";
import { Thumb } from "../content/ui";
import type { LiveThumbId } from "./ids";
import { useLiveRow, useWarmDemo } from "./store";

/** Code fetched when idle, mounted only while the row is hovered. */
const LOADERS = {
  "grafika-realtime": () => import("./RippleDemo"),
  "animacje-ui": () => import("./BallDemo"),
} as const satisfies Record<LiveThumbId, unknown>;
const DEMOS = {
  "grafika-realtime": lazy(LOADERS["grafika-realtime"]),
  "animacje-ui": lazy(LOADERS["animacje-ui"]),
};

/**
 * A skill thumbnail that comes alive while its row is hovered (desktop
 * mouse): the demo mounts on top of the picture, crossfades in and unmounts
 * after the row is left. Everywhere else it is the plain thumbnail.
 */
export function LiveThumb({ id, image, className }: { id: LiveThumbId; image: ImageSet | null; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const state = useLiveRow(ref, id);
  useWarmDemo(LOADERS[id]);
  const Demo = DEMOS[id];
  return (
    <span ref={ref} className={`relative block ${className}`}>
      <Thumb image={image} className="size-full" eager />
      {state !== "off" && image && (
        <Suspense fallback={null}>
          <Demo active={state === "active"} />
        </Suspense>
      )}
    </span>
  );
}
