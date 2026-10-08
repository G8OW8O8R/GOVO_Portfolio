"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";
import { DESKTOP_MEDIA } from "@/lib/character-box";
import { LIVE } from "@/lib/motion-tokens";
import { REDUCED_MOTION } from "../ghost";

/**
 * Live skills: at most one demo is active at a time – the one
 * of the skill row under the mouse. A demo stays mounted for the crossfade
 * after the row is left (`fading`), then unmounts and frees what it holds.
 * Desktop with a mouse only; touch and reduced motion keep the thumbnails.
 */

let active: string | null = null;
let fading: string | null = null;
let fadeTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

function activate(id: string | null) {
  if (active === id) return;
  clearTimeout(fadeTimer);
  fading = id === null ? active : null; // a new demo replaces the old one at once
  active = id;
  if (fading) {
    fadeTimer = setTimeout(() => {
      fading = null;
      emit();
    }, LIVE.crossfadeMs);
  }
  emit();
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};

export const liveEnabled = () =>
  matchMedia(DESKTOP_MEDIA).matches &&
  matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !matchMedia(REDUCED_MOTION).matches;

/**
 * Fetches a demo's code while the browser is idle (desktop with a mouse
 * only), so the first hover only mounts it – no network or parse in that frame.
 */
export function useWarmDemo(load: () => Promise<unknown>) {
  useEffect(() => {
    if (!liveEnabled()) return;
    const ric = window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 200));
    const cic = window.cancelIdleCallback ?? clearTimeout;
    const id = ric(() => void load());
    return () => cic(id);
  }, [load]);
}

export type LiveState = "off" | "active" | "fading";

/** Hovering the row around `ref` (its <li>) activates demo `id`. */
export function useLiveRow(ref: RefObject<Element | null>, id: string): LiveState {
  useEffect(() => {
    const row = ref.current?.closest("li");
    if (!row || !liveEnabled()) return;
    const enter = (e: PointerEvent) => e.pointerType === "mouse" && activate(id);
    const leave = () => active === id && activate(null);
    row.addEventListener("pointerenter", enter);
    row.addEventListener("pointerleave", leave);
    // the row may already be under the mouse when the tab opens
    if (row.matches(":hover")) activate(id);
    return () => {
      row.removeEventListener("pointerenter", enter);
      row.removeEventListener("pointerleave", leave);
      leave();
    };
  }, [ref, id]);
  return useSyncExternalStore(
    subscribe,
    () => (active === id ? "active" : fading === id ? "fading" : "off"),
    () => "off",
  );
}
