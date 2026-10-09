"use client";

import { useEffect } from "react";
import type { ImageRef } from "@/lib/images";
import { afterStart } from "@/components/intro/after-intro";
import { canLoadAhead, warmImages } from "@/components/ui/warm-images";
import { usePrefetchWindow } from "@/components/window/prefetch";

/**
 * Loads every window ahead once nothing else needs the connection: after
 * the intro, after the character's full base (or a grace period), in an idle
 * moment. Fast connections only. First the windows' routes (content and
 * code, so a later click or tap opens at once), then their pictures at low
 * priority. A window already loaded by hover, focus or touch isn't fetched again.
 */
export function LoadAhead({ windows, images }: { windows: string[]; images: ImageRef[] }) {
  const prefetch = usePrefetchWindow();

  useEffect(() => {
    if (!canLoadAhead()) return;
    return afterStart(() => {
      windows.forEach(prefetch);
      warmImages(images, "low");
    });
  }, [windows, images, prefetch]);

  return null;
}
