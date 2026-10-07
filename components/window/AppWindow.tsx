"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { animate, m, useMotionValue } from "motion/react";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import { DESKTOP_MEDIA } from "@/lib/character-box";
import { characterGaze } from "@/lib/character/look-at";
import { DURATION, SHEET_SPRING, SPRING, WINDOW_ENTER_SPRING } from "@/lib/motion-tokens";
import type { WindowKey } from "@/lib/routes";
import { SIDE_MEDIA, clampWindowOffset } from "@/lib/window-layout";
import { REDUCED_MOTION, flip, playExit, windowAnchor } from "./ghost";
import { useWindowOpenSettled, windowStore } from "./store";
import { useWindowNav } from "./useWindowNav";
import s from "./window.module.css";

export type WindowLabels = {
  close: string;
  minimize: string;
  fullscreen: string;
  exitFullscreen: string;
  dragHint: string;
};

type WindowContextValue = { windowKey: WindowKey; scrollerRef: RefObject<HTMLDivElement | null> };
const WindowContext = createContext<WindowContextValue | null>(null);
export const useAppWindow = () => useContext(WindowContext);

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, iframe, [tabindex]:not([tabindex="-1"])';

const isDesktop = () => matchMedia(DESKTOP_MEDIA).matches;
/** Wide desktop: the character steps aside and the window slides in from the right. */
const isSide = () => matchMedia(SIDE_MEDIA).matches;

/** How long the gaze keeps following a scroll of the window content, ms. */
const SCROLL_GLANCE_MS = 900;

/**
 * A desktop window (macOS style) or, on phones, a bottom sheet. The page
 * renders its content on the server; this adds the chrome and behaviour:
 * grow from the file (shared element), working dots, drag by the title bar,
 * full screen, Esc, focus trap and focus return, swipe down to close.
 */
export function AppWindow({
  windowKey,
  title,
  labels,
  children,
}: {
  windowKey: WindowKey;
  title: string;
  labels: WindowLabels;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { close } = useWindowNav();
  const [fullscreen, setFullscreen] = useState(false);

  const sideEnter = useRef(false);
  const settled = useWindowOpenSettled();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const opacity = useMotionValue(1);

  // Enter: grow from the file / opener (shared element); sheet slides up on phones.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const origin = windowStore.takeOrigin(() => windowAnchor(windowKey));
    if (!origin) return;
    if (matchMedia(REDUCED_MOTION).matches) {
      animate(opacity, [0, 1], { duration: DURATION.fast });
      return;
    }
    if (!isDesktop()) {
      animate(y, [el.getBoundingClientRect().height, 0], SHEET_SPRING);
      return;
    }
    if (isSide()) {
      // waits off to the right; slides in when the character starts stepping aside (below)
      x.set(el.getBoundingClientRect().width * 0.45);
      opacity.set(0);
      sideEnter.current = true;
      return;
    }
    const f = flip(origin.getBoundingClientRect(), el.getBoundingClientRect());
    animate(x, [f.x, 0], SPRING);
    animate(y, [f.y, 0], SPRING);
    animate(scaleX, [f.scaleX, 1], SPRING);
    animate(scaleY, [f.scaleY, 1], SPRING);
    animate(opacity, [0, 1], { duration: DURATION.fast });
  }, [windowKey, x, y, scaleX, scaleY, opacity]);

  // Side layout: the window and the character start together (the desktop
  // reacts to the settled state); the window's spring trails a little, so its
  // edge never passes the face mid-way (lib/window-layout.ts tests the end state).
  useEffect(() => {
    if (!settled || !sideEnter.current) return;
    sideEnter.current = false;
    animate(x, 0, WINDOW_ENTER_SPRING);
    animate(opacity, 1, { duration: DURATION.base });
  }, [settled, x, opacity]);

  // The title bar turns frosted only once content scrolls under it.
  useEffect(() => {
    const el = ref.current;
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    const onScroll = () => el.toggleAttribute("data-scrolled", scroller.scrollTop > 2);
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  // Desktop: the character watches the window; scrolling its content draws the
  // eyes a little up or down for a moment. Later lookAt calls (a form field) win.
  useEffect(() => {
    const el = ref.current;
    const scroller = scrollerRef.current;
    if (!el || !scroller || !isDesktop()) return;
    const glance = { dir: 0, at: -Infinity, top: scroller.scrollTop };
    const onScroll = () => {
      const dy = scroller.scrollTop - glance.top;
      glance.top = scroller.scrollTop;
      if (Math.abs(dy) < 1) return;
      glance.dir = Math.sign(dy);
      glance.at = performance.now();
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const release = characterGaze.lookAt(() => {
      if (!el.isConnected) return null;
      const r = el.getBoundingClientRect();
      const k = Math.max(0, 1 - (performance.now() - glance.at) / SCROLL_GLANCE_MS);
      return { x: r.left + r.width / 2, y: r.top + r.height * 0.42 + glance.dir * k * r.height * 0.15 };
    });
    return () => {
      release();
      scroller.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Full screen: the character hides (stageShiftCss reacts to this attribute).
  useEffect(() => {
    const root = document.documentElement;
    if (fullscreen) root.setAttribute("data-window-fullscreen", "");
    else root.removeAttribute("data-window-fullscreen");
    return () => root.removeAttribute("data-window-fullscreen");
  }, [fullscreen]);

  // Exit: React has removed the window, a static clone plays the animation.
  useLayoutEffect(() => {
    const el = ref.current;
    const scroller = scrollerRef.current;
    if (!el) return;
    return () => {
      const r = el.getBoundingClientRect();
      const rect = { left: r.left, top: r.top, width: r.width, height: r.height };
      const scrollTop = scroller?.scrollTop ?? 0;
      const clone = el.cloneNode(true) as HTMLElement;
      const mode = windowStore.takeExitMode();
      requestAnimationFrame(() => {
        if (el.isConnected) return; // StrictMode re-mount, not a real exit
        if (rect.width > 0) playExit(clone, rect, mode, windowKey, scrollTop);
        // Focus back to the file (unless another window took over).
        if (!document.querySelector("[data-app-window]")) {
          const target =
            windowStore.takeReturnFocus() ??
            document.querySelector<HTMLElement>(`[data-file-key="${windowKey}"] a`) ??
            document.querySelector<HTMLElement>(`[data-window-anchor="${windowKey}"]`);
          target?.focus({ preventScroll: true });
        }
      });
    };
  }, [windowKey]);

  // A minimised window comes back as it was (tab: Tabs, scroll: here, after the tab switch).
  useEffect(() => {
    const memory = windowStore.recall(windowKey);
    if (!memory) return;
    const raf = requestAnimationFrame(() => {
      if (scrollerRef.current) scrollerRef.current.scrollTop = memory.scrollTop;
      windowStore.forget(windowKey);
    });
    return () => cancelAnimationFrame(raf);
  }, [windowKey]);

  // Focus the dialog when it opens; lock page scroll behind the phone sheet.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    if (isDesktop()) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  const minimize = useCallback(() => {
    windowStore.remember(windowKey, {
      scrollTop: scrollerRef.current?.scrollTop ?? 0,
      tab: location.hash.slice(1) || undefined,
    });
    close("minimize");
  }, [close, windowKey]);

  const toggleFullscreen = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const before = el.getBoundingClientRect();
    flushSync(() => setFullscreen((v) => !v));
    x.set(0);
    y.set(0);
    if (matchMedia(REDUCED_MOTION).matches) return;
    const f = flip(before, el.getBoundingClientRect());
    animate(x, [f.x, 0], SPRING);
    animate(y, [f.y, 0], SPRING);
    animate(scaleX, [f.scaleX, 1], SPRING);
    animate(scaleY, [f.scaleY, 1], SPRING);
  }, [x, y, scaleX, scaleY]);

  // Drag by the title bar (desktop) / swipe the sheet down (phone).
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; t: number } | null>(null);

  const onBarPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as Element).closest("button")) return;
    if (isDesktop() && fullscreen) return;
    x.stop();
    y.stop();
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: x.get(), oy: y.get(), t: e.timeStamp };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onBarPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || d.id !== e.pointerId || !el) return;
    if (!isDesktop()) {
      y.set(Math.max(0, d.oy + e.clientY - d.sy));
      return;
    }
    const base = el.getBoundingClientRect();
    const rect = { x: base.left - x.get(), y: base.top - y.get(), width: base.width, height: base.height };
    const next = clampWindowOffset(
      rect,
      { x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy },
      { width: window.innerWidth, height: window.innerHeight },
    );
    x.set(next.x);
    y.set(next.y);
  };

  const onBarPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!isDesktop()) settleSheet(e.clientY - d.sy, e.timeStamp - d.t);
  };

  function settleSheet(dy: number, ms: number) {
    const velocity = ms > 0 ? (dy / ms) * 1000 : 0;
    if (dy > 120 || (dy > 30 && velocity > 700)) close();
    else animate(y, 0, SHEET_SPRING);
  }
  const settleRef = useRef(settleSheet);
  useLayoutEffect(() => {
    settleRef.current = settleSheet;
  });

  // Phone: pulling the content down at its top drags the sheet.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let start: { y: number; t: number } | null = null;
    let pulling = false;
    const onStart = (e: TouchEvent) => {
      if (isDesktop() || e.touches.length !== 1) return;
      start = { y: e.touches[0].clientY, t: e.timeStamp };
      pulling = false;
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const dy = e.touches[0].clientY - start.y;
      if (!pulling && dy > 6 && scroller.scrollTop <= 0) {
        pulling = true;
        y.stop(); // a gesture interrupts the slide-in
      }
      if (pulling) {
        e.preventDefault();
        y.set(Math.max(0, dy));
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (start && pulling) settleRef.current(y.get(), e.timeStamp - start.t);
      start = null;
      pulling = false;
    };
    scroller.addEventListener("touchstart", onStart, { passive: true });
    scroller.addEventListener("touchmove", onMove, { passive: false });
    scroller.addEventListener("touchend", onEnd);
    scroller.addEventListener("touchcancel", onEnd);
    return () => {
      scroller.removeEventListener("touchstart", onStart);
      scroller.removeEventListener("touchmove", onMove);
      scroller.removeEventListener("touchend", onEnd);
      scroller.removeEventListener("touchcancel", onEnd);
    };
  }, [y]);

  const trapFocus = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key !== "Tab" || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (n) => n.getClientRects().length > 0 && !n.closest("[hidden],[inert]"),
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <WindowContext.Provider value={{ windowKey, scrollerRef }}>
      <div className={s.layer}>
        <m.section
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          data-app-window={windowKey}
          data-fullscreen={fullscreen || undefined}
          className={s.window}
          style={{ x, y, scaleX, scaleY, opacity }}
          onKeyDown={trapFocus}
        >
          <header
            className={s.bar}
            onPointerDown={onBarPointerDown}
            onPointerMove={onBarPointerMove}
            onPointerUp={onBarPointerUp}
            onPointerCancel={onBarPointerUp}
          >
            <span className={s.grabber} aria-hidden="true" title={labels.dragHint} />
            <div className={s.dots}>
              <button type="button" className={`${s.dot} ${s.dotClose}`} onClick={() => close()} aria-label={labels.close} title={labels.close}>
                <X strokeWidth={3} aria-hidden="true" />
              </button>
              <button type="button" className={`${s.dot} ${s.dotMin}`} onClick={minimize} aria-label={labels.minimize} title={labels.minimize}>
                <Minus strokeWidth={3} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${s.dot} ${s.dotZoom}`}
                onClick={toggleFullscreen}
                aria-label={fullscreen ? labels.exitFullscreen : labels.fullscreen}
                aria-pressed={fullscreen}
                title={fullscreen ? labels.exitFullscreen : labels.fullscreen}
              >
                {fullscreen ? <Minimize2 strokeWidth={3} aria-hidden="true" /> : <Maximize2 strokeWidth={3} aria-hidden="true" />}
              </button>
            </div>
            <p id={titleId} className={s.title}>
              {title}
            </p>
            <button type="button" className={s.sheetClose} onClick={() => close()} aria-label={labels.close}>
              <X aria-hidden="true" />
            </button>
          </header>
          <div ref={scrollerRef} className={s.scroller} data-window-scroller="">
            {children}
          </div>
        </m.section>
      </div>
    </WindowContext.Provider>
  );
}
