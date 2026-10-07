"use client";

import { useOpenWindowKey } from "./store";
import { useWindowNav } from "./useWindowNav";
import { WindowHistory } from "./WindowHistory";

/**
 * Light dim + blur over the desktop while a window is open (the character
 * stays visible). Clicking it closes the window. Also hosts the history
 * tracker and the layer for exit animations.
 */
export function WindowBackdrop() {
  const open = useOpenWindowKey() !== null;
  const { close } = useWindowNav();
  return (
    <>
      <WindowHistory />
      <div
        aria-hidden="true"
        data-open={open || undefined}
        onClick={() => close()}
        className="fixed inset-0 z-35 bg-[rgb(214_213_215/0.3)] opacity-0 backdrop-blur-[3px] transition-opacity duration-300 pointer-events-none data-open:pointer-events-auto data-open:opacity-100 motion-reduce:backdrop-blur-none"
      />
      <div id="window-ghosts" className="pointer-events-none fixed inset-0 z-41" aria-hidden="true" />
    </>
  );
}

/** Desktop layer (top bar, character, files): inert while a window is open. */
export function DesktopLayer({ children, className }: { children: React.ReactNode; className?: string }) {
  const open = useOpenWindowKey() !== null;
  return (
    <div className={className} inert={open} data-window-open={open || undefined}>
      {children}
    </div>
  );
}
