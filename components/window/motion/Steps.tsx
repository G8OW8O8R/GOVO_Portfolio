"use client";

import { useLayoutEffect, useRef } from "react";
import { CONTENT_MOTION } from "@/lib/motion-tokens";
import { EASE, observeInWindow, usePanelPlay, useWindowScroller } from "./shared";

/**
 * Numbered path on one surface (How I work, Process): step numbers on a thin
 * line that joins them, not separate cards. Each time the tab opens the line
 * draws itself downwards (scaleY from the top) as the steps come into view,
 * and every step number turns black when the line reaches it. Final state
 * (no JS, hydration, reduced motion): full line, all numbers black.
 */
export function Steps({ items, className = "" }: { items: { title: string; text: string }[]; className?: string }) {
  const token = usePanelPlay();
  const scroller = useWindowScroller();
  const ref = useRef<HTMLOListElement>(null);

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list || token === null) return;
    const steps = [...list.querySelectorAll<HTMLElement>("[data-step]")];
    const lines = steps.map((s) => s.querySelector<HTMLElement>("[data-step-line]"));
    const lights = steps.map((s) => s.querySelector<HTMLElement>("[data-step-light]")!);
    lines.forEach((l) => l && (l.style.transform = "scaleY(0)"));
    lights.forEach((l) => (l.style.opacity = "0"));

    const anims: Animation[] = [];
    const visible = new Set<number>();
    let next = 0;
    let busy = false;

    const light = (i: number) => {
      lights[i].style.opacity = "";
      anims.push(lights[i].animate({ opacity: [0, 1] }, { duration: CONTENT_MOTION.light.ms, easing: EASE }));
    };
    // step 0 lights when it shows; the line to step i draws once step i shows, then i lights
    const advance = () => {
      if (busy || next >= steps.length || !visible.has(next)) return;
      const i = next++;
      const line = i > 0 ? lines[i - 1] : null;
      if (!line) {
        light(i);
        advance();
        return;
      }
      busy = true;
      line.style.transform = "";
      const draw = line.animate({ transform: ["scaleY(0)", "none"] }, { duration: CONTENT_MOTION.segment.ms, easing: EASE });
      anims.push(draw);
      draw.finished
        .then(() => {
          busy = false;
          light(i);
          advance();
        })
        .catch(() => {});
    };

    const stops = steps.map((step, i) =>
      observeInWindow(
        step,
        scroller?.current ?? null,
        (inView) => {
          if (!inView) return;
          visible.add(i);
          advance();
        },
        { rootMargin: "0px 0px -12% 0px" },
      ),
    );
    return () => {
      stops.forEach((stop) => stop());
      anims.forEach((a) => a.cancel());
      lines.forEach((l) => l && (l.style.transform = ""));
      lights.forEach((l) => (l.style.opacity = ""));
    };
  }, [token, scroller]);

  return (
    <ol ref={ref} data-stagger="" className={`rounded-surface bg-surface px-5 py-6 shadow-surface desk:px-8 desk:py-8 ${className}`}>
      {items.map((item, i) => (
        <li key={item.title} data-step="" className="relative grid grid-cols-[40px_1fr] gap-x-4 pb-7 last:pb-0">
          {i < items.length - 1 && (
            <span data-step-line="" className="absolute bottom-1 left-[19.5px] top-11 w-px origin-top bg-ink/25" aria-hidden="true" />
          )}
          <span
            className="relative grid size-10 place-items-center rounded-full bg-win-fill font-mono text-13 tabular-nums text-ink"
            aria-hidden="true"
          >
            {String(i + 1).padStart(2, "0")}
            <span data-step-light="" className="absolute inset-0 grid place-items-center rounded-full bg-ink text-white">
              {String(i + 1).padStart(2, "0")}
            </span>
          </span>
          <div className="pt-2">
            <h4 className="text-17 font-semibold tracking-[-0.01em] text-ink">{item.title}</h4>
            <p className="mt-1 text-15 text-ink-soft">{item.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
