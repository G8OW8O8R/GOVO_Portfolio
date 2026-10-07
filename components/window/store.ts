"use client";

import { usePathname } from "next/navigation";
import { windowKeyForPath, type WindowKey } from "@/lib/routes";

/**
 * Client-side window state shared by the desktop, the open window and the
 * backdrop. Windows themselves are route pages (server-rendered); this only
 * carries what a URL can't: where the window should grow from, how it should
 * leave, and what to remember when it is minimised.
 */

export type ExitMode = "close" | "minimize";

type Memory = { scrollTop: number; tab?: string };

const state = {
  /** The previous history entry is the bare desktop (so closing = history back). */
  previousIsDesktop: false,
  /** Element the next window grows from (file icon, pendant, capsule …). */
  origin: null as Element | null,
  /** Element focused before the window opened. */
  returnFocus: null as HTMLElement | null,
  exitMode: "close" as ExitMode,
  /** Set by popstate: the window reopened from history animates from its file. */
  fromHistory: false,
  memory: new Map<WindowKey, Memory>(),
};

export const windowStore = {
  get previousIsDesktop() {
    return state.previousIsDesktop;
  },
  set previousIsDesktop(v: boolean) {
    state.previousIsDesktop = v;
  },

  /** Where the next window grows from; focus returns to whatever had it (the file link). */
  setOrigin(el: Element | null) {
    state.origin = el;
    const active = document.activeElement;
    state.returnFocus = active instanceof HTMLElement && active !== document.body ? active : null;
  },

  /** Origin for a mounting window (consumed once). */
  takeOrigin(fallback: () => Element | null): Element | null {
    const el = state.origin ?? (state.fromHistory ? fallback() : null);
    state.origin = null;
    state.fromHistory = false;
    return el?.isConnected ? el : null;
  },

  takeReturnFocus(): HTMLElement | null {
    const el = state.returnFocus;
    state.returnFocus = null;
    return el?.isConnected ? el : null;
  },

  markFromHistory() {
    state.fromHistory = true;
  },

  setExitMode(mode: ExitMode) {
    state.exitMode = mode;
  },

  takeExitMode(): ExitMode {
    const mode = state.exitMode;
    state.exitMode = "close";
    return mode;
  },

  remember(key: WindowKey, memory: Memory) {
    state.memory.set(key, memory);
  },
  forget(key: WindowKey) {
    state.memory.delete(key);
  },
  recall(key: WindowKey): Memory | undefined {
    return state.memory.get(key);
  },
};

/** The window shown by the current URL (also on the server, so SSR matches). */
export function useOpenWindowKey(): WindowKey | null {
  return windowKeyForPath(usePathname());
}
