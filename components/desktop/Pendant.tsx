"use client";

import { useRef } from "react";
import { characterGaze } from "@/lib/character/look-at";
import { useWindowNav } from "@/components/window/useWindowNav";
import s from "./desktop.module.css";

/**
 * Invisible button over the OVO pendant (placed with the character box):
 * hover sweeps light across the diamonds, click flashes and opens Contact.
 */
export function Pendant({ href, label }: { href: string; label: string }) {
  const { open } = useWindowNav();
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <a
      ref={ref}
      href={href}
      className={s.pendant}
      aria-label={label}
      title={label}
      onPointerEnter={() => characterGaze.flash()}
      onFocus={() => characterGaze.flash()}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        characterGaze.flash();
        open(href, ref.current);
      }}
    />
  );
}
