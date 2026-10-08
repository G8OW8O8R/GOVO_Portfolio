"use client";

import { createContext, useContext } from "react";
import { CONTENT_MOTION, EASE_OUT, cssBezier } from "@/lib/motion-tokens";
import { useAppWindow } from "../AppWindow";
import { REDUCED_MOTION } from "../ghost";

/**
 * Motion inside windows. Every effect plays
 * once per opening of its tab: Tabs hands each panel a play token that
 * changes whenever the panel opens with motion, and is null when it should
 * simply be in its final state (hidden tab, server render and hydration of a
 * window URL, reduced motion). Components render the final state by default
 * and set their start state in a layout effect, before the first paint.
 */
export const PanelPlayContext = createContext<number | null>(null);
export const usePanelPlay = () => useContext(PanelPlayContext);

export const EASE = cssBezier(EASE_OUT);

export const prefersReducedMotion = () => typeof window !== "undefined" && matchMedia(REDUCED_MOTION).matches;

/** The window's own scroller: IntersectionObservers inside a window use it as the root. */
export function useWindowScroller() {
  return useAppWindow()?.scrollerRef ?? null;
}

/** Calls `onChange` when `el` enters or leaves the visible part of the window scroller. */
export function observeInWindow(
  el: Element,
  root: Element | null,
  onChange: (inView: boolean) => void,
  options: { threshold?: number; rootMargin?: string } = {},
) {
  const io = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { root, ...options });
  io.observe(el);
  return () => io.disconnect();
}

/**
 * Enter of a panel (first visit of a tab, opening of a tab-less window):
 * the old panel (if any) fades out, the new one fades in rising 8 px and its
 * list items (`[data-stagger] > *`) follow 35 ms apart. Opacity/transform only
 * and no fill forwards on the new content, so nothing stays on the text.
 */
export function playEnter(to: HTMLElement | null, from?: HTMLElement | null): Animation[] {
  const { ms, shift, stagger, maxItems } = CONTENT_MOTION.enter;
  const items = [...(to?.querySelectorAll<HTMLElement>("[data-stagger] > *") ?? [])].slice(0, maxItems);
  return [
    // the old panel stays faded out until it unmounts (the list items may still be coming in)
    from?.animate({ opacity: [1, 0] }, { duration: ms, easing: EASE, fill: "forwards" }),
    to?.animate({ opacity: [0, 1], transform: [`translateY(${shift}px)`, "none"] }, { duration: ms, easing: EASE }),
    ...items.map((item, i) =>
      item.animate({ opacity: [0, 1] }, { duration: ms, delay: (i + 1) * stagger, easing: EASE, fill: "backwards" }),
    ),
  ].filter((a): a is Animation => !!a);
}
