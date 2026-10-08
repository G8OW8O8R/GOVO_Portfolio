"use client";

import { animate } from "motion/react";
import { DESKTOP_MEDIA } from "@/lib/character-box";
import { DURATION, EASE_IN } from "@/lib/motion-tokens";
import { fileKeyForWindow, type WindowKey } from "@/lib/routes";
import type { ExitMode } from "./store";

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Where a window minimises to and grows from: its desktop file, or the element that opens it. */
export function windowAnchor(key: WindowKey): Element | null {
  return (
    document.querySelector(`[data-file-key="${fileKeyForWindow(key)}"] [data-file-icon]`) ??
    document.querySelector(`[data-window-anchor="${key}"]`)
  );
}

export type Box = { left: number; top: number; width: number; height: number };

/** Transform (around the centre) that maps box `to` onto box `from`. */
export function flip(from: Box, to: Box) {
  return {
    x: from.left + from.width / 2 - (to.left + to.width / 2),
    y: from.top + from.height / 2 - (to.top + to.height / 2),
    scaleX: from.width / to.width,
    scaleY: from.height / to.height,
  };
}

/**
 * Exit animation for a window that React has already unmounted (close button,
 * Esc, backdrop, browser back – all the same path): a static clone of the
 * window plays the exit and removes itself.
 */
export function playExit(clone: HTMLElement, rect: Box, mode: ExitMode, key: WindowKey, scrollTop: number) {
  const host = document.getElementById("window-ghosts") ?? document.body;
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  clone.querySelectorAll("iframe, video").forEach((n) => n.replaceWith(document.createElement("div")));
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("inert", "");
  clone.removeAttribute("role");
  clone.removeAttribute("data-app-window");
  Object.assign(clone.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    right: "auto",
    bottom: "auto",
    margin: "0",
    transform: "none",
    pointerEvents: "none",
  });
  host.appendChild(clone);
  const scroller = clone.querySelector<HTMLElement>("[data-window-scroller]");
  if (scroller) scroller.scrollTop = scrollTop;

  const reduced = matchMedia(REDUCED_MOTION).matches;
  const desktop = matchMedia(DESKTOP_MEDIA).matches;
  const done = () => clone.remove();

  if (reduced) {
    animate(clone, { opacity: 0 }, { duration: DURATION.fast }).then(done, done);
    return;
  }
  if (!desktop) {
    animate(clone, { y: window.innerHeight - rect.top }, { duration: 0.28, ease: EASE_IN }).then(done, done);
    return;
  }
  const anchor = mode === "minimize" ? windowAnchor(key) : null;
  if (anchor) {
    const f = flip(anchor.getBoundingClientRect(), rect);
    animate(
      clone,
      { x: f.x, y: f.y, scaleX: f.scaleX, scaleY: f.scaleY, opacity: [1, 1, 0] },
      { duration: DURATION.slow, ease: [0.5, 0, 0.2, 1], opacity: { duration: DURATION.slow, times: [0, 0.7, 1] } },
    ).then(done, done);
    return;
  }
  animate(clone, { scale: 0.96, opacity: 0 }, { duration: 0.18, ease: EASE_IN }).then(done, done);
}
