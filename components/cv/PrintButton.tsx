"use client";

import { Printer } from "lucide-react";

/** Prints the CV sheet (globals.css isolates it on an A4 page). */
export function PrintButton({ label, className }: { label: string; className: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer className="size-4.5" aria-hidden="true" />
      {label}
    </button>
  );
}
