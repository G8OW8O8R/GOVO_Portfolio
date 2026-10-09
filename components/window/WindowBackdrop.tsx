"use client";

import { useDriveWindowOpenSettled, useOpenWindowKey } from "./store";
import { useWindowNav } from "./useWindowNav";
import { WindowHistory } from "./WindowHistory";
// the windows' code comes with the desktop, so a window waits only for its content
import "./window-code";

/**
 * Light dim + blur over the desktop while a window is open; clicking it
 * closes the window. On the desktop it is light (half the phone strength), so
 * the character stays clear enough to be seen watching the window; files and
 * top bar get the rest from a static blur of their own ([data-dim],
 * app/globals.css). Only opacity animates: one top-level backdrop layer is
 * composited cheaply, animated filters are not (measured).
 * Also hosts the history tracker and the layer for exit animations.
 */
export function WindowBackdrop() {
  // at once: its first frame (a new backdrop pass) shares the window's mount frame
  const open = useOpenWindowKey() !== null;
  const { close } = useWindowNav();
  return (
    <>
      <WindowHistory />
      <div
        aria-hidden="true"
        data-open={open || undefined}
        onClick={() => close()}
        className="pointer-events-none fixed inset-0 z-35 bg-[rgb(214_213_215/0.3)] opacity-0 backdrop-blur-[3px] transition-opacity duration-300 data-open:pointer-events-auto data-open:opacity-100 desk:bg-[rgb(214_213_215/0.15)] desk:backdrop-blur-[1.5px] motion-reduce:backdrop-blur-none"
      />
      <div id="window-ghosts" className="pointer-events-none fixed inset-0 z-41" aria-hidden="true" />
    </>
  );
}

/** Desktop layer (top bar, character, files): inert while a window is open (at once), dimmed (settled). */
export function DesktopLayer({ children, className }: { children: React.ReactNode; className?: string }) {
  const open = useOpenWindowKey() !== null;
  const settled = useDriveWindowOpenSettled();
  return (
    <div className={className} inert={open} data-window-open={settled || undefined}>
      {children}
    </div>
  );
}
