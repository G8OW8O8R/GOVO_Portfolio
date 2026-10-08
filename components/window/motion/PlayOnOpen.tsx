"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { PanelPlayContext, playEnter, prefersReducedMotion } from "./shared";

const noSubscribe = () => () => {};

/**
 * Play token for a window without tabs (CV): the content enters like a tab on
 * its first visit (playEnter) and its effects (Steps) run once per opening of
 * the window. Mounted by a client-side open → plays; the hydration of a window
 * URL, print and reduced motion → the final state, nothing moves.
 */
export function PlayOnOpen({ children, className }: { children: ReactNode; className?: string }) {
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [play] = useState(() => hydrated && !prefersReducedMotion());
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!play) return;
    const anims = playEnter(ref.current);
    return () => anims.forEach((a) => a.cancel());
  }, [play]);

  return (
    <PanelPlayContext.Provider value={play ? 0 : null}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </PanelPlayContext.Provider>
  );
}
