"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { windowKeyForPath } from "@/lib/routes";
import { nextPreviousIsDesktop, type NavKind } from "@/lib/window-history";
import { windowStore } from "./store";

let pending: NavKind | null = null;

/** Called right before a router.push/replace so the next path change is classified. */
export function expectNavigation(kind: "push" | "replace") {
  pending = kind;
}

/**
 * Classifies every path change (our push/replace, history pop, or a plain
 * link = push) and keeps windowStore.previousIsDesktop in sync.
 */
export function WindowHistory() {
  const pathname = usePathname();
  const prev = useRef(pathname);

  useEffect(() => {
    const onPop = () => {
      pending = "pop";
      if (windowKeyForPath(location.pathname)) windowStore.markFromHistory();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (prev.current === pathname) return;
    const kind = pending ?? "push";
    pending = null;
    windowStore.previousIsDesktop = nextPreviousIsDesktop(
      windowStore.previousIsDesktop,
      kind,
      { isDesktop: windowKeyForPath(prev.current) === null },
      { isDesktop: windowKeyForPath(pathname) === null },
    );
    prev.current = pathname;
  }, [pathname]);

  return null;
}
