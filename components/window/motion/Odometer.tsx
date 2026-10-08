"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { odometerReels } from "@/lib/format";
import { CONTENT_MOTION } from "@/lib/motion-tokens";
import { EASE, observeInWindow, usePanelPlay, useWindowScroller } from "./shared";

/** The thousands separator in PL (non-breaking space). */
const NBSP = " ";
const SPACE = /[  ]/;

/** Thousands apart by a narrow gap, not a full mono cell. */
function Groups({ amount }: { amount: string }) {
  return amount.split(SPACE).map((group, i) => (
    <span key={i} className={i ? "ml-[0.18em]" : undefined}>
      {group}
    </span>
  ));
}

/**
 * A price amount whose digits roll like an odometer (CONTENT_MOTION.count)
 * the first time it comes into view after the tab opens (the digits roll in
 * from below an empty slot, through 0 to their value). Every reel
 * cell holds the final digit invisibly, so the width and baseline never
 * change (tabular mono digits); when the reels stop, plain text takes their
 * place again – no transform left on the text.
 */
export function Odometer({ amount }: { amount: string }) {
  const token = usePanelPlay();
  const scroller = useWindowScroller();
  const ref = useRef<HTMLSpanElement>(null);
  // reels from the first paint of an opening tab until they stop for this token
  const [stopped, setStopped] = useState<number | null>(null);
  const rolling = token !== null && stopped !== token;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!rolling || !el) return;
    let anims: Animation[] = [];
    const stop = observeInWindow(
      el,
      scroller?.current ?? null,
      (inView) => {
        if (!inView || anims.length) return;
        stop();
        anims = [...el.querySelectorAll<HTMLElement>("[data-reel]")].map((reel) => {
          const n = reel.childElementCount;
          return reel.animate(
            { transform: ["none", `translateY(${(-(n - 1) / n) * 100}%)`] },
            { duration: CONTENT_MOTION.count.ms, easing: EASE, fill: "forwards" },
          );
        });
        Promise.all(anims.map((a) => a.finished))
          .then(() => setStopped(token))
          .catch(() => {});
      },
      { threshold: 0.6 },
    );
    return () => {
      stop();
      anims.forEach((a) => a.cancel());
    };
  }, [rolling, token, scroller]);

  if (!rolling) return <Groups amount={amount} />;
  return (
    <span ref={ref}>
      <span className="sr-only">{amount}</span>
      <span aria-hidden="true">
        {odometerReels(amount).map((reel, i, all) => {
          const gap = i > 0 && all[i - 1] === NBSP ? "ml-[0.18em]" : "";
          if (reel === NBSP || reel === " ") return null;
          if (typeof reel === "string") return <span key={i} className={gap}>{reel}</span>;
          return (
            <span key={i} className={`relative inline-block ${gap}`}>
              <span className="invisible">{reel.at(-1)}</span>
              <span className="absolute inset-0 overflow-hidden">
                {/* an empty slot first: a price waiting below the fold shows no stray zeros */}
                <span data-reel="" className="absolute inset-x-0 top-0 flex flex-col">
                  <span>{" "}</span>
                  {reel.map((d, k) => (
                    <span key={k}>{d}</span>
                  ))}
                </span>
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
