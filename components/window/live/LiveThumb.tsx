"use client";

import { lazy, Suspense, useRef } from "react";
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
export function LiveThumb({ id, src, sizes, className }: { id: LiveThumbId; src: string | null; sizes: string; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const state = useLiveRow(ref, id);
  useWarmDemo(LOADERS[id]);
  const Demo = DEMOS[id];
  return (
    <span ref={ref} className={`relative block ${className}`}>
      <Thumb src={src} sizes={sizes} className="size-full" />
      {state !== "off" && src && (
        <Suspense fallback={null}>
          <Demo active={state === "active"} />
        </Suspense>
      )}
    </span>
  );
}
