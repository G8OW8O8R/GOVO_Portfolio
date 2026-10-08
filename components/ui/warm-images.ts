"use client";

import { srcsets, type ImageRef } from "@/lib/images";

const warmed = new Set<string>();

/**
 * Starts loading pictures before they are shown: a detached <picture> with
 * the same sources and sizes picks the same file as the real one later, which
 * then comes from the cache. Each picture once per page.
 */
export function warmImages(refs: readonly ImageRef[], priority: "high" | "low" | "auto" = "auto") {
  for (const ref of refs) {
    const id = `${ref.key}.${ref.hash}`;
    if (warmed.has(id)) continue;
    warmed.add(id);
    const { avif, webp, sizes } = srcsets(ref);
    const picture = document.createElement("picture");
    const source = document.createElement("source");
    source.type = "image/avif";
    source.sizes = sizes;
    source.srcset = avif;
    const img = document.createElement("img");
    img.decoding = "async";
    img.fetchPriority = priority;
    img.sizes = sizes;
    picture.append(source, img);
    img.srcset = webp;
  }
}

/** Whether the connection is good for loading ahead (no data saver, 4G or better). */
export function canLoadAhead(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !(c && (c.saveData || (c.effectiveType && c.effectiveType !== "4g")));
}
