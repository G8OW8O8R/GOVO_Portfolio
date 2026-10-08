"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { CONTENT_MOTION } from "@/lib/motion-tokens";
import { EASE, prefersReducedMotion } from "./shared";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const { ms, maxDeg, lift, perspective } = CONTENT_MOTION.tilt;

/**
 * A thumbnail that leans towards the cursor in 3D (max 6°) and lifts 4 px
 * while hovered; mouse only, never on touch or with reduced motion. Pictures
 * only – no text inside – and the transform is removed once it settles back.
 */
export function Tilt({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const leaving = useRef(false);

  const enabled = (e: PointerEvent) => e.pointerType === "mouse" && matchMedia(FINE_POINTER).matches && !prefersReducedMotion();

  const onPointerMove = (e: PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el || !enabled(e)) return;
    const { clientX, clientY } = e;
    leaving.current = false;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(-1, ((clientX - r.left) / r.width) * 2 - 1));
      const y = Math.min(1, Math.max(-1, ((clientY - r.top) / r.height) * 2 - 1));
      el.style.transition = `transform ${ms}ms ${EASE}`;
      el.style.transform = `perspective(${perspective}px) translateY(-${lift}px) rotateX(${(-y * maxDeg).toFixed(2)}deg) rotateY(${(x * maxDeg).toFixed(2)}deg)`;
    });
  };

  const onPointerLeave = () => {
    const el = ref.current;
    cancelAnimationFrame(frame.current);
    if (!el || !el.style.transform) return;
    leaving.current = true;
    el.style.transform = `perspective(${perspective}px) translateY(0) rotateX(0) rotateY(0)`;
    const settle = (e: TransitionEvent) => {
      if (e.target !== el) return;
      el.removeEventListener("transitionend", settle);
      if (!leaving.current) return; // back under the cursor before it settled
      el.style.transform = "";
      el.style.transition = "";
    };
    el.addEventListener("transitionend", settle);
  };

  return (
    <span ref={ref} className={className} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      {children}
    </span>
  );
}
