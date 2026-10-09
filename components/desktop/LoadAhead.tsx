"use client";

import { useEffect } from "react";
import type { ImageRef } from "@/lib/images";
import { currentIntro } from "@/lib/intro";
import { canLoadAhead, warmImages } from "@/components/ui/warm-images";
import { usePrefetchWindow } from "@/components/window/prefetch";

/** After the intro, the character gets this long to swap in its full base before the windows go. */
const CHARACTER_GRACE_MS = 3000;

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
    const html = document.documentElement;
    const cleanups: (() => void)[] = [];

    const idle = () => {
      const run = () => {
        windows.forEach(prefetch);
        warmImages(images, "low");
      };
      if ("requestIdleCallback" in window) {
        const id = requestIdleCallback(run, { timeout: 2000 });
        cleanups.push(() => cancelIdleCallback(id));
      } else {
        const id = setTimeout(run, 200);
        cleanups.push(() => clearTimeout(id));
      }
    };

    const afterCharacter = () => {
      if (performance.getEntriesByName("character:full").length) return idle();
      const observer = new PerformanceObserver((list) => {
        if (!list.getEntriesByName("character:full").length) return;
        clearTimeout(timer);
        observer.disconnect();
        idle();
      });
      const timer = setTimeout(() => {
        observer.disconnect();
        idle();
      }, CHARACTER_GRACE_MS);
      observer.observe({ type: "mark" });
      cleanups.push(() => {
        clearTimeout(timer);
        observer.disconnect();
      });
    };

    const mode = currentIntro();
    if (mode === "none" || mode === "fade" || html.hasAttribute("data-intro-done")) afterCharacter();
    else {
      const observer = new MutationObserver(() => {
        if (!html.hasAttribute("data-intro-done")) return;
        observer.disconnect();
        afterCharacter();
      });
      observer.observe(html, { attributes: true, attributeFilter: ["data-intro-done"] });
      cleanups.push(() => observer.disconnect());
    }
    return () => cleanups.forEach((c) => c());
  }, [windows, images, prefetch]);

  return null;
}
