"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { CONTENT_MOTION } from "@/lib/motion-tokens";
import { EASE, observeInWindow, usePanelPlay, useWindowScroller } from "./shared";

export type StepItem = { title: string; text: string; meta?: ReactNode; tags?: string[] };

/** Class names of each part; the CV passes its own (printed sizes), the windows use SURFACE. */
export type StepsLook = {
  list: string;
  item: string;
  line: string;
  number: string;
  light: string;
  body: string;
  head?: string;
  title: string;
  meta?: string;
  text: string;
  tags?: string;
  heading: "h3" | "h4";
  /** The number is printed once, on the lit layer (no "0101" in the CV's text layer). */
  litNumberOnly?: boolean;
};

const SURFACE: StepsLook = {
  list: "rounded-surface bg-surface px-5 py-6 shadow-surface desk:px-8 desk:py-8",
  item: "relative grid grid-cols-[40px_1fr] gap-x-4 pb-7 last:pb-0",
  line: "absolute bottom-1 left-[19.5px] top-11 w-px origin-top bg-ink/25",
  number: "relative grid size-10 place-items-center rounded-full bg-win-fill font-mono text-13 tabular-nums text-ink",
  light: "absolute inset-0 grid place-items-center rounded-full bg-ink text-white",
  body: "pt-2",
  title: "text-17 font-semibold tracking-[-0.01em] text-ink",
  text: "mt-1 text-15 text-ink-soft",
  heading: "h4",
};

/**
 * Numbered path (How I work, Process, the CV's projects): step numbers on a
 * thin line that joins them, not separate cards. Each time the tab opens the line
 * draws itself downwards (scaleY from the top) as the steps come into view,
 * and every step number turns black when the line reaches it. Final state
 * (no JS, hydration, reduced motion): full line, all numbers black.
 */
export function Steps({
  items,
  className = "",
  look = SURFACE,
  heading = look.heading,
}: {
  items: StepItem[];
  className?: string;
  look?: StepsLook;
  /** Step titles one level under the section: h3 on pages with their own h1 */
  heading?: StepsLook["heading"];
}) {
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

  const Heading = heading;
  return (
    <ol ref={ref} data-stagger="" className={`${look.list} ${className}`}>
      {items.map((item, i) => {
        const n = String(i + 1).padStart(2, "0");
        return (
          <li key={item.title} data-step="" className={look.item}>
            {i < items.length - 1 && <span data-step-line="" className={look.line} aria-hidden="true" />}
            <span className={look.number} aria-hidden="true">
              {!look.litNumberOnly && n}
              <span data-step-light="" className={look.light}>
                {n}
              </span>
            </span>
            <div className={look.body}>
              <div className={look.head}>
                <Heading className={look.title}>{item.title}</Heading>
                {item.meta && <p className={look.meta}>{item.meta}</p>}
              </div>
              <p className={look.text}>{item.text}</p>
              {item.tags && <p className={look.tags}>{item.tags.join(" · ")}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
