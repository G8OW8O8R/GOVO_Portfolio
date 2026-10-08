"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { CURSOR } from "@/lib/motion-tokens";
import { pointer } from "@/lib/pointer";
import { cursorFlags } from "./store";
import s from "./cursor.module.css";

export type CursorLabels = { open: string; play: string; pause: string };

type State = "dot" | "open" | "play" | "pause" | "link" | "hidden";

const FINE = "(hover: hover) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

/** Where the pointer is decides the look: fields and frames hide it, tagged elements name their action. */
function stateFor(target: EventTarget | null): State {
  if (!(target instanceof Element)) return "dot";
  if (target.closest('input, textarea, select, iframe, [contenteditable="true"]')) return "hidden";
  const tagged = target.closest("[data-cursor]")?.getAttribute("data-cursor");
  if (tagged === "open" || tagged === "play" || tagged === "pause") return tagged;
  if (target.closest("a[href]")) return "link";
  return "dot";
}

const subscribeMedia = (fn: () => void) => {
  const queries = [matchMedia(FINE), matchMedia(REDUCED)];
  queries.forEach((q) => q.addEventListener("change", fn));
  return () => queries.forEach((q) => q.removeEventListener("change", fn));
};
const enabledNow = () => matchMedia(FINE).matches && !matchMedia(REDUCED).matches;

/**
 * The custom cursor: an 8 px #111 dot that follows the
 * pointer on a spring, next to the system cursor (which stays). Over a
 * desktop file it becomes an "Open" capsule, over a playable video "Play" /
 * "Pause", over a link an arrow; it stretches along the motion while a file
 * is dragged and disappears over form fields. Mouse only: off on touch and
 * with reduced motion. One fixed layer moved by transform; the frame loop
 * runs only while the dot is catching up. Its position is the page-wide
 * pointer (lib/pointer.ts) – the same the character's eyes follow.
 */
export function Cursor({ labels }: { labels: CursorLabels }) {
  const enabled = useSyncExternalStore(subscribeMedia, enabledNow, () => false);
  if (!enabled) return null;
  return <CursorLayer labels={labels} />;
}

function CursorLayer({ labels }: { labels: CursorLabels }) {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const d = dot.current;
    if (!el || !d) return;
    const { stiffness, damping } = CURSOR.spring;
    const pos = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    let raf = 0;
    let last = 0;
    let shown = false;
    let under: EventTarget | null = null;
    let stretched = false;

    const setState = () => {
      const next = cursorFlags.dragging ? "dot" : stateFor(under);
      if (el.dataset.state !== next) el.dataset.state = next;
      el.toggleAttribute("data-drag", cursorFlags.dragging);
    };

    const write = (x: number, y: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
      last = now;
      if (el.hasAttribute("data-drag") !== cursorFlags.dragging) setState();
      const ax = stiffness * (pos.tx - pos.x) - damping * pos.vx;
      const ay = stiffness * (pos.ty - pos.y) - damping * pos.vy;
      pos.vx += ax * dt;
      pos.vy += ay * dt;
      pos.x += pos.vx * dt;
      pos.y += pos.vy * dt;

      if (cursorFlags.dragging) {
        const speed = Math.hypot(pos.vx, pos.vy);
        const k = Math.min(CURSOR.stretch.max, speed * CURSOR.stretch.perSpeed);
        d.style.transform = `rotate(${Math.atan2(pos.vy, pos.vx)}rad) scale(${1 + k}, ${1 / (1 + k * 0.6)})`;
        stretched = true;
      } else if (stretched) {
        d.style.transform = "";
        stretched = false;
      }

      const settled =
        Math.abs(pos.tx - pos.x) < 0.1 && Math.abs(pos.ty - pos.y) < 0.1 && Math.hypot(pos.vx, pos.vy) < 2;
      if (settled) {
        // whole pixels at rest: the capsule's text stays crisp
        pos.x = pos.tx;
        pos.y = pos.ty;
        pos.vx = pos.vy = 0;
        write(Math.round(pos.x), Math.round(pos.y));
        if (stretched) {
          d.style.transform = "";
          stretched = false;
        }
        raf = 0;
        return;
      }
      write(pos.x, pos.y);
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const off = pointer.subscribe((p) => {
      if (p.kind !== "mouse" || !p.inside) {
        el.removeAttribute("data-visible");
        shown = false;
        return;
      }
      pos.tx = p.x;
      pos.ty = p.y;
      if (!shown) {
        // first sight (or back on the page): appear where the pointer is, no chase across the screen
        pos.x = p.x;
        pos.y = p.y;
        pos.vx = pos.vy = 0;
        write(p.x, p.y);
        el.setAttribute("data-visible", "");
        shown = true;
      }
      if (p.phase === "up" || p.phase === "down") setState();
      wake();
    });

    const onOver = (e: Event) => {
      under = e.target;
      setState();
    };
    // a click can change what the element offers (play ⇄ pause), a drag ends
    const onClick = () => requestAnimationFrame(setState);
    document.addEventListener("pointerover", onOver, { capture: true, passive: true });
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => {
      off();
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerover", onOver, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return (
    <div ref={root} className={s.cursor} data-state="dot" aria-hidden="true">
      <span className={s.dotWrap}>
        <span ref={dot} className={s.dot} />
      </span>
      <span className={`${s.tag} ${s.open}`}>{labels.open}</span>
      <span className={`${s.tag} ${s.play}`}>{labels.play}</span>
      <span className={`${s.tag} ${s.pause}`}>{labels.pause}</span>
      <span className={s.arrow}>
        <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 9 9 3M4 3h5v5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
