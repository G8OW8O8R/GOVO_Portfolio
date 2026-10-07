"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { m } from "motion/react";
import { X } from "lucide-react";
import Link from "next/link";

export type Preview = {
  title: string;
  summary: string;
  cover: string;
  /** preview.mp4 when it exists (it takes over from the cover). */
  video: string | null;
};

function Media({ preview, sizes }: { preview: Preview; sizes: string }) {
  return (
    <span className="relative block aspect-[16/10] overflow-hidden rounded-[10px] bg-[#1b1b1d]">
      <Image src={preview.cover} alt="" fill sizes={sizes} className="object-cover" loading="eager" />
      {preview.video && (
        <video
          className="absolute inset-0 size-full object-cover"
          src={preview.video}
          poster={preview.cover}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
    </span>
  );
}

/** Small preview next to a hovered project icon: no dim, no focus, gone on leave. */
export function HoverPreview({ preview, anchor }: { preview: Preview; anchor: DOMRect }) {
  const width = 232;
  const gap = 14;
  const right = anchor.right + gap + width < innerWidth - 8;
  const left = right ? anchor.right + gap : anchor.left - gap - width;
  const top = Math.min(Math.max(anchor.top + anchor.height / 2 - 82, 72), innerHeight - 190);
  return createPortal(
    <m.div
      aria-hidden="true"
      className="pointer-events-none fixed z-30 rounded-[14px] border border-glass-border bg-glass-strong p-1.5 shadow-glass backdrop-blur-xl"
      style={{ left, top, width }}
      initial={{ opacity: 0, scale: 0.94, x: right ? -6 : 6 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", visualDuration: 0.22, bounce: 0.1 }}
    >
      <Media preview={preview} sizes="232px" />
      <span className="block px-1.5 pb-1 pt-2 text-[12.5px] font-semibold text-ink">{preview.title}</span>
    </m.div>,
    document.body,
  );
}

/** Quick look (Space or long press): larger preview with "Open". */
export function QuickLook({
  preview,
  href,
  labels,
  onOpen,
  onClose,
}: {
  preview: Preview;
  href: string;
  labels: { label: string; open: string; close: string };
  onOpen: () => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.key === " " && !(e.target instanceof HTMLButtonElement))) {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>("a, button")];
        const i = items.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-45 grid place-items-center p-4" onClick={onClose}>
      <m.div
        className="absolute inset-0 bg-[rgb(214_213_215/0.35)] backdrop-blur-[4px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
      />
      <m.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`${labels.label}: ${preview.title}`}
        className="relative w-full max-w-[560px] rounded-[18px] bg-win p-3 shadow-window"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", visualDuration: 0.3, bounce: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Media preview={preview} sizes="(max-width: 600px) 92vw, 540px" />
        <div className="flex items-start gap-4 px-2 pb-1 pt-4">
          <div className="min-w-0 flex-1">
            <p className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{preview.title}</p>
            <p className="mt-1 text-[14px] leading-snug text-ink-soft">{preview.summary}</p>
          </div>
          <Link
            href={href}
            scroll={false}
            onClick={(e) => {
              e.preventDefault();
              onOpen();
            }}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-[14px] font-medium text-white hover:brightness-110"
          >
            {labels.open}
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-black/60"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </m.div>
    </div>,
    document.body,
  );
}
