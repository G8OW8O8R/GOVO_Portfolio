"use client";

import { createContext, useContext } from "react";
import { EASE_OUT, cssBezier } from "@/lib/motion-tokens";
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
