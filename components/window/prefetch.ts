"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

const requested = new Set<string>();

/**
 * Loads a window's route (its server-rendered content; the code comes with
 * the desktop) once per page, when the visitor shows intent: hover, keyboard
 * focus or a touch on its link. Window links don't prefetch on sight, so the
 * start doesn't download every window; the rest follow after the intro
 * (LoadAhead).
 */
export function usePrefetchWindow() {
  const router = useRouter();
  return useCallback(
    (href: string) => {
      if (requested.has(href)) return;
      requested.add(href);
      router.prefetch(href);
    },
    [router],
  );
}
