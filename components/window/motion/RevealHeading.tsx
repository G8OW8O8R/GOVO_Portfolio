"use client";

import { Fragment, useLayoutEffect, useRef, type ElementType, type RefObject } from "react";
import { CONTENT_MOTION } from "@/lib/motion-tokens";
import { lineIndexes } from "@/lib/split-lines";
import { EASE, usePanelPlay } from "./shared";

/** Below the mask: more than the word's own height plus the mask padding. */
const HIDDEN = "translateY(130%)";

/**
 * Text as words, each in its own mask (globals.css `[data-mask]`). The words
 * stay real text in the server HTML; lines are found from the layout when
 * the reveal plays, so wrapping, balance and centring are the browser's own.
 */
export function Words({ text }: { text: string }) {
  return text.split(" ").map((word, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span data-mask="">
        <span data-word="">{word}</span>
      </span>
    </Fragment>
  ));
}

/**
 * Reveals every `[data-word]` inside `ref` line by line from under its mask
 * (CONTENT_MOTION.reveal), once per play token. Lines are measured after the
 * fonts have loaded, on the layout of that moment (the current width), and
 * words of one line move together. When done nothing is left on the words:
 * no transform, no will-change.
 */
export function useLineReveal(ref: RefObject<HTMLElement | null>, onStart?: () => void, onDone?: () => void) {
  const token = usePanelPlay();
  const callbacks = useRef({ onStart, onDone });
  useLayoutEffect(() => {
    callbacks.current = { onStart, onDone };
  });

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || token === null) return;
    const words = [...root.querySelectorAll<HTMLElement>("[data-word]")];
    words.forEach((w) => (w.style.transform = HIDDEN));
    callbacks.current.onStart?.();
    let anims: Animation[] = [];
    let raf = 0;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      raf = requestAnimationFrame(() => {
        const lines = lineIndexes(words.map((w) => w.parentElement!.getBoundingClientRect().top));
        const { ms, stagger } = CONTENT_MOTION.reveal;
        anims = words.map((w, i) => {
          w.style.transform = "";
          return w.animate({ transform: [HIDDEN, "none"] }, { duration: ms, delay: lines[i] * stagger, easing: EASE, fill: "backwards" });
        });
        Promise.all(anims.map((a) => a.finished))
          .then(() => callbacks.current.onDone?.())
          .catch(() => {});
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      anims.forEach((a) => a.cancel());
      words.forEach((w) => (w.style.transform = ""));
    };
  }, [ref, token]);
}

/** The main heading of a tab, revealed line by line each time the tab opens. */
export function RevealHeading({
  as: Tag = "h2",
  text,
  className,
  id,
}: {
  as?: ElementType;
  text: string;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useLineReveal(ref);
  return (
    <Tag ref={ref} id={id} className={className}>
      <Words text={text} />
    </Tag>
  );
}
