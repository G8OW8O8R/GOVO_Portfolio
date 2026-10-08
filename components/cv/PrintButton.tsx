"use client";

import { Printer } from "lucide-react";

/** The static print fonts (cv.module.css): loaded before the dialog, so the PDF embeds TrueType, not Type 3. */
const PRINT_FONTS = [
  '400 1em "Schibsted Grotesk CV"',
  '500 1em "Schibsted Grotesk CV"',
  '700 1em "Schibsted Grotesk CV"',
  '400 1em "JetBrains Mono CV"',
];

/** Prints the CV sheet (globals.css isolates it on an A4 page). */
export function PrintButton({ label, className }: { label: string; className: string }) {
  const print = async () => {
    // offline or blocked: the variable fonts print instead
    await Promise.all(PRINT_FONTS.map((font) => document.fonts.load(font).catch(() => {})));
    window.print();
  };
  return (
    <button type="button" onClick={print} className={className}>
      <Printer className="size-4.5" aria-hidden="true" />
      {label}
    </button>
  );
}
