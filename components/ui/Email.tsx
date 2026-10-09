"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { assembleEmail } from "@/content/profile/contact";

/**
 * The e-mail address is assembled in the browser after hydration, so the
 * server HTML never contains it (no plain-text harvesting).
 */
const noSubscribe = () => () => {};

export function useEmail(): string | null {
  // server (and hydration) snapshot: null → the address never reaches the HTML
  return useSyncExternalStore(noSubscribe, assembleEmail, () => null);
}

export function mailto(email: string, subject?: string) {
  return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}

/**
 * mailto: link. Until the address is assembled it points to `fallbackHref`
 * (the Contact window), so it is never a dead link.
 */
export function EmailLink({
  fallbackHref,
  subject,
  className,
  children,
  ...aria
}: {
  fallbackHref: string;
  subject?: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  title?: string;
}) {
  const email = useEmail();
  return (
    <a className={className} href={email ? mailto(email, subject) : fallbackHref} {...aria}>
      {children}
    </a>
  );
}

/**
 * The address as text (empty placeholder of the same height until assembled).
 * `fallback`: what a screen reader hears until then (and without JS), so the
 * link around it is never nameless.
 */
export function EmailText({ className, fallback }: { className?: string; fallback?: string }) {
  const email = useEmail();
  if (!email && fallback) {
    return (
      <span className={className} aria-live="polite">
        <span className="sr-only">{fallback}</span>
      </span>
    );
  }
  return (
    <span className={className} aria-live="polite">
      {email ?? " "}
    </span>
  );
}
