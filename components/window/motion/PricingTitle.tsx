"use client";

import { useLayoutEffect, useRef } from "react";
import { CONTENT_MOTION } from "@/lib/motion-tokens";
import { EASE, usePanelPlay } from "./shared";
import { Words, useLineReveal } from "./RevealHeading";

/**
 * "Szybko i dobrze." large and black, "Długo i drogo." smaller, grey and
 * struck through. Both lines rise from under their masks; then the strike is
 * drawn from the left (SVG stroke-dashoffset). Final state by default: the
 * line is there without JS, on hydration and with reduced motion.
 */
export function PricingTitle({ strong, struck }: { strong: string; struck: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const line = useRef<SVGLineElement>(null);
  const drawing = useRef<Animation | null>(null);
  const token = usePanelPlay();

  // a closed or replayed tab never keeps a half-drawn strike
  useLayoutEffect(
    () => () => {
      drawing.current?.cancel();
      if (line.current) line.current.style.strokeDashoffset = "";
    },
    [token],
  );

  useLineReveal(
    ref,
    () => {
      drawing.current?.cancel();
      if (line.current) line.current.style.strokeDashoffset = "1";
    },
    () => {
      const el = line.current;
      if (!el) return;
      el.style.strokeDashoffset = "";
      drawing.current = el.animate(
        { strokeDashoffset: ["1", "0"] },
        { duration: CONTENT_MOTION.draw.ms, easing: EASE, fill: "backwards" },
      );
    },
  );

  return (
    <h2 ref={ref} className="text-balance text-center font-semibold text-ink">
      <span className="block text-40 tracking-[-0.035em] desk:text-56">
        <Words text={strong} />
      </span>
      <s className="relative mt-1.5 inline-block whitespace-nowrap text-28 tracking-[-0.03em] text-ink-soft no-underline desk:mt-2 desk:text-40">
        <Words text={struck} />
        <svg aria-hidden="true" className="pointer-events-none absolute -inset-x-[0.06em] top-[calc(50%-0.05em)] h-[0.2em] w-[calc(100%+0.12em)] overflow-visible">
          <line
            ref={line}
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            pathLength={1}
            strokeDasharray="1"
            stroke="currentColor"
            strokeLinecap="round"
            className="[stroke-width:0.075em]"
          />
        </svg>
      </s>
    </h2>
  );
}
