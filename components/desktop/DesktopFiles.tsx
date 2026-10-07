"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { animate, m, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { characterGaze } from "@/lib/character/look-at";
import { DESKTOP_MEDIA, computeCharacterBox } from "@/lib/character-box";
import {
  POSITIONS_KEY,
  addScreenDelta,
  isTidy,
  loadOffsets,
  moveLimits,
  releaseVelocity,
  saveOffsets,
  type Offset,
  type Offsets,
  type Sample,
} from "@/lib/desktop-positions";
import type { Depth } from "@/lib/desktop-slots";
import type { WindowKey } from "@/lib/routes";
import { computeWindowRect, overlaps } from "@/lib/window-layout";
import { REDUCED_MOTION } from "@/components/window/ghost";
import { useOpenWindowKey } from "@/components/window/store";
import { useWindowNav } from "@/components/window/useWindowNav";
import { HoverPreview, QuickLook, type Preview } from "./QuickLook";
import s from "./desktop.module.css";

export type DesktopFile = {
  key: WindowKey;
  label: string;
  href: string;
  icon: string;
  slot: { x: number; y: number; depth: Depth };
  badge?: string;
  preview?: Preview;
};

export type FilesLabels = {
  files: string;
  tidy: string;
  tidyLabel: string;
  hint: string;
  moveHint: string;
  quickLook: { label: string; open: string; close: string };
};

const HOVER_PREVIEW_MS = 600;
const LONG_PRESS_MS = 420;
const DRAG_THRESHOLD = 5;
const KEY_STEP = 16;
/** Files stay below the top bar and above the dock (never under it). */
const AREA_MARGIN = { top: 64, side: 8, bottom: 96 };
/** A file this close to the window counts as covered. */
const COVER_MARGIN = 12;

const isDesktop = () => matchMedia(DESKTOP_MEDIA).matches;
const desktopScale = () => computeCharacterBox({ width: innerWidth, height: innerHeight }, "desktop").scale;
const area = () => ({
  left: AREA_MARGIN.side,
  top: AREA_MARGIN.top,
  right: innerWidth - AREA_MARGIN.side,
  bottom: innerHeight - AREA_MARGIN.bottom,
});

function readStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/** Applies a stored offset (image px) as CSS: --dx/--dy, scaled by --cb-s in CSS. */
function applyOffset(el: HTMLElement | null, o: Offset | undefined) {
  if (!el) return;
  el.style.setProperty("--dx", String(o?.dx ?? 0));
  el.style.setProperty("--dy", String(o?.dy ?? 0));
}

/** Remembered offsets as an external store: {} on the server and during hydration. */
function createOffsetsStore(keys: readonly string[]) {
  const listeners = new Set<() => void>();
  const EMPTY: Offsets = {};
  let cache: Offsets | null = null;
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    get: () => (cache ??= loadOffsets(readStorage(), keys)),
    server: () => EMPTY,
    set(next: Offsets) {
      cache = next;
      saveOffsets(readStorage(), next);
      listeners.forEach((l) => l());
    },
  };
}

/**
 * Desktop files: drag with inertia, parallax on 3 depths, remembered
 * positions, the character looks at the hovered/focused file, quick look.
 * On phones they are a static home-screen grid (tap opens, long press peeks).
 */
export function DesktopFiles({ files, labels }: { files: DesktopFile[]; labels: FilesLabels }) {
  const [store] = useState(() => createOffsetsStore(files.map((f) => f.key)));
  const offsets = useSyncExternalStore(store.subscribe, store.get, store.server);
  const [tidyTick, setTidyTick] = useState(0);
  const [hover, setHover] = useState<{ file: DesktopFile; rect: DOMRect } | null>(null);
  const [quick, setQuick] = useState<{ file: DesktopFile; from: HTMLElement } | null>(null);
  const { open } = useWindowNav();

  // Pointer parallax (desktop, motion allowed)
  const px = useSpring(0, { stiffness: 50, damping: 16, mass: 1 });
  const py = useSpring(0, { stiffness: 50, damping: 16, mass: 1 });

  useEffect(() => {
    if (matchMedia(REDUCED_MOTION).matches) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !isDesktop()) return;
      px.set((e.clientX / innerWidth - 0.5) * 2);
      py.set((e.clientY / innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py]);

  // Files the open window would cover hide (CSS: [data-covered]); the rest dim.
  const windowOpen = useOpenWindowKey() !== null;
  useEffect(() => {
    const mark = () => {
      const win = windowOpen && isDesktop() ? computeWindowRect({ width: innerWidth, height: innerHeight }) : null;
      for (const el of document.querySelectorAll<HTMLElement>("[data-file-key]")) {
        const r = el.getBoundingClientRect();
        const covered = !!win && overlaps({ x: r.left, y: r.top, width: r.width, height: r.height }, win, COVER_MARGIN);
        el.toggleAttribute("data-covered", covered);
      }
    };
    mark();
    if (!windowOpen) return;
    window.addEventListener("resize", mark);
    return () => window.removeEventListener("resize", mark);
  }, [windowOpen]);

  const commit = useCallback((key: string, next: Offset) => store.set({ ...store.get(), [key]: next }), [store]);

  const tidy = () => {
    setTidyTick((t) => t + 1);
    store.set({});
  };

  const tidyNeeded = !isTidy(offsets);
  const preHydrate = `(function(){try{var d=JSON.parse(localStorage.getItem(${JSON.stringify(POSITIONS_KEY)})||"{}");for(var k in d){var e=document.querySelector('[data-file-key="'+k+'"]');if(e&&d[k]){e.style.setProperty("--dx",d[k].dx);e.style.setProperty("--dy",d[k].dy)}}}catch(_){}})()`;

  return (
    <>
      <nav aria-label={labels.files}>
        <ul className={s.files}>
          {files.map((file) => (
            <FileItem
              key={file.key}
              file={file}
              offset={offsets[file.key]}
              tidyTick={tidyTick}
              parallax={[px, py]}
              onCommit={commit}
              onHover={(rect) => setHover(rect ? { file, rect } : null)}
              onQuickLook={(from) => {
                setHover(null);
                setQuick({ file, from });
              }}
            />
          ))}
        </ul>
        <p id="file-hint-project" hidden>
          {labels.hint}
        </p>
        <p id="file-hint" hidden>
          {labels.moveHint}
        </p>
        <script dangerouslySetInnerHTML={{ __html: preHydrate }} />
      </nav>

      {tidyNeeded && (
        <button type="button" className={s.tidy} onClick={tidy} aria-label={labels.tidyLabel} data-dim="">
          {labels.tidy}
        </button>
      )}

      {hover?.file.preview && <HoverPreview preview={hover.file.preview} anchor={hover.rect} />}
      {quick?.file.preview && (
        <QuickLook
          preview={quick.file.preview}
          href={quick.file.href}
          labels={labels.quickLook}
          onOpen={() => {
            const from = quick.from;
            setQuick(null);
            open(quick.file.href, from.querySelector("[data-file-icon]") ?? from);
          }}
          onClose={() => {
            const from = quick.from;
            setQuick(null);
            from.focus({ preventScroll: true });
          }}
        />
      )}
    </>
  );
}

function FileItem({
  file,
  offset,
  tidyTick,
  parallax: [px, py],
  onCommit,
  onHover,
  onQuickLook,
}: {
  file: DesktopFile;
  offset: Offset | undefined;
  tidyTick: number;
  parallax: [MotionValue<number>, MotionValue<number>];
  onCommit: (key: string, next: Offset) => void;
  onHover: (rect: DOMRect | null) => void;
  onQuickLook: (from: HTMLElement) => void;
}) {
  const li = useRef<HTMLLIElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const icon = useRef<HTMLSpanElement>(null);
  const { open } = useWindowNav();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const depth = file.slot.depth;
  const parallaxX = useTransform(px, (v) => -v * depth * 4);
  const parallaxY = useTransform(py, (v) => -v * depth * 3);

  const offsetRef = useRef(offset);
  useLayoutEffect(() => {
    offsetRef.current = offset;
    applyOffset(li.current, offset);
  }, [offset]);

  // Tidy: glide back to the slot from wherever the file is.
  const firstTick = useRef(tidyTick);
  useEffect(() => {
    if (tidyTick === firstTick.current) return;
    const o = offsetRef.current;
    if (!o || !li.current) return;
    const scale = desktopScale();
    x.set(x.get() + o.dx * scale);
    y.set(y.get() + o.dy * scale);
    applyOffset(li.current, undefined);
    const spring = { type: "spring", visualDuration: 0.6, bounce: 0.2 } as const;
    animate(x, 0, spring);
    animate(y, 0, spring);
  }, [tidyTick, x, y]);

  // Idle glances of the character include this file.
  useEffect(() => (icon.current ? characterGaze.registerGlanceTarget(icon.current) : undefined), []);

  // Gaze: look at the file while hovered or focused.
  const releaseGaze = useRef<(() => void) | null>(null);
  const lookHere = () => {
    if (!releaseGaze.current && icon.current) releaseGaze.current = characterGaze.lookAt(icon.current);
  };
  const lookAway = () => {
    releaseGaze.current?.();
    releaseGaze.current = null;
  };
  useEffect(() => lookAway, []);

  // Hover preview after 600 ms (desktop mouse, projects only)
  const hoverTimer = useRef<number | undefined>(undefined);
  const clearHover = () => {
    window.clearTimeout(hoverTimer.current);
    onHover(null);
  };

  // Pointer: drag with inertia, long press = quick look, otherwise click opens.
  const press = useRef<{
    id: number;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    limits: ReturnType<typeof moveLimits>;
    samples: Sample[];
    dragging: boolean;
    timer?: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const settling = useRef(0);

  const finishMove = useCallback(() => {
    const dx = x.get();
    const dy = y.get();
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    const next = addScreenDelta(offsetRef.current, dx, dy, desktopScale());
    applyOffset(li.current, next);
    x.set(0);
    y.set(0);
    onCommit(file.key, next);
  }, [file.key, onCommit, x, y]);

  const onPointerDown = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    if (e.button !== 0) return;
    suppressClick.current = false;
    x.stop();
    y.stop();
    const r = li.current!.getBoundingClientRect();
    press.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ox: x.get(),
      oy: y.get(),
      limits: moveLimits(
        { left: r.left - x.get(), top: r.top - y.get(), right: r.right - x.get(), bottom: r.bottom - y.get() },
        area(),
      ),
      samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }],
      dragging: false,
    };
    if (file.preview) {
      const target = e.currentTarget;
      press.current.timer = window.setTimeout(() => {
        if (!press.current || press.current.dragging) return;
        suppressClick.current = true;
        press.current = null;
        onQuickLook(target);
      }, LONG_PRESS_MS);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.sx;
    const dy = e.clientY - p.sy;
    if (!p.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      window.clearTimeout(p.timer);
      if (!isDesktop()) {
        press.current = null; // phones scroll; no dragging on the home screen
        return;
      }
      p.dragging = true;
      clearHover();
      e.currentTarget.setPointerCapture(e.pointerId);
      li.current?.setAttribute("data-dragging", "");
    }
    p.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    if (p.samples.length > 12) p.samples.shift();
    const { minX, maxX, minY, maxY } = p.limits;
    x.set(Math.min(maxX, Math.max(minX, p.ox + dx)));
    y.set(Math.min(maxY, Math.max(minY, p.oy + dy)));
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    window.clearTimeout(p.timer);
    press.current = null;
    if (!p.dragging) return;
    suppressClick.current = true;
    li.current?.removeAttribute("data-dragging");
    const { vx, vy } = releaseVelocity(p.samples);
    const reduced = matchMedia(REDUCED_MOTION).matches;
    const run = ++settling.current;
    const glide = (mv: MotionValue<number>, velocity: number, min: number, max: number) =>
      reduced
        ? Promise.resolve()
        : animate(mv, mv.get(), {
            type: "inertia",
            velocity,
            min,
            max,
            power: 0.32,
            timeConstant: 300,
            bounceStiffness: 420,
            bounceDamping: 34,
            restDelta: 0.5,
          });
    void Promise.all([
      glide(x, vx, p.limits.minX, p.limits.maxX),
      glide(y, vy, p.limits.minY, p.limits.maxY),
    ]).then(() => {
      if (run === settling.current) finishMove();
    });
  };

  const onClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    clearHover();
    open(file.href, icon.current);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLAnchorElement>) => {
    if ((e.key === " " || e.key === "Spacebar") && file.preview) {
      e.preventDefault();
      onQuickLook(e.currentTarget);
      return;
    }
    if (e.altKey && e.key.startsWith("Arrow") && isDesktop()) {
      e.preventDefault();
      const r = li.current!.getBoundingClientRect();
      const lim = moveLimits(r, area());
      const step = e.shiftKey ? KEY_STEP * 4 : KEY_STEP;
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      const mx = Math.min(lim.maxX, Math.max(lim.minX, dx));
      const my = Math.min(lim.maxY, Math.max(lim.minY, dy));
      onCommit(file.key, addScreenDelta(offsetRef.current, mx, my, desktopScale()));
    }
  };

  const style = { "--sx": file.slot.x, "--sy": file.slot.y, x, y } as unknown as CSSProperties;

  return (
    <m.li ref={li} className={s.slot} data-file-key={file.key} data-dim="" style={style} suppressHydrationWarning>
      <m.span className={s.parallax} style={{ x: parallaxX, y: parallaxY }}>
        <Link
          ref={link}
          href={file.href}
          scroll={false}
          className={s.file}
          draggable={false}
          aria-describedby={file.preview ? "file-hint-project" : "file-hint"}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onContextMenu={(e) => {
            if (!isDesktop()) e.preventDefault();
          }}
          onPointerEnter={(e) => {
            lookHere();
            if (e.pointerType !== "mouse" || !file.preview || !isDesktop()) return;
            window.clearTimeout(hoverTimer.current);
            hoverTimer.current = window.setTimeout(() => {
              if (!press.current?.dragging && icon.current) onHover(icon.current.getBoundingClientRect());
            }, HOVER_PREVIEW_MS);
          }}
          onPointerLeave={() => {
            if (!press.current?.dragging && document.activeElement !== link.current) lookAway();
            clearHover();
          }}
          onFocus={lookHere}
          onBlur={() => {
            if (!link.current?.matches(":hover")) lookAway();
          }}
        >
          <span className={s.iconWrap}>
            <span ref={icon} className={s.squircle} data-file-icon="">
              <Image src={file.icon} width={1024} height={1024} alt="" sizes="88px" loading="eager" draggable={false} />
            </span>
            {file.badge && <span className={s.badge}>{file.badge}</span>}
          </span>
          <span className={s.label}>{file.label}</span>
        </Link>
      </m.span>
    </m.li>
  );
}
