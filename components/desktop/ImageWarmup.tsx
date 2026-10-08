"use client";

import { useEffect } from "react";
import type { ImageRef } from "@/lib/images";
import { currentIntro } from "@/lib/intro";
import { canLoadAhead, warmImages } from "@/components/ui/warm-images";

/** After the intro, the character gets this long to swap in its full base before the pictures go. */
const CHARACTER_GRACE_MS = 3000;

/**
 * Loads the pictures of every window ahead, at low priority, once nothing
 * else needs the connection: after the intro, after the character's full
 * base (or a grace period), in an idle moment. Fast connections only.
 */
export function ImageWarmup({ images }: { images: ImageRef[] }) {
  useEffect(() => {
    if (!canLoadAhead()) return;
    const html = document.documentElement;
    const cleanups: (() => void)[] = [];

    const idle = () => {
      const run = () => warmImages(images, "low");
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
  }, [images]);

  return null;
}
