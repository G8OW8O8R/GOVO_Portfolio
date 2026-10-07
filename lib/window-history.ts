/**
 * Tracks whether the history entry before the current one is the bare
 * desktop. Only then may "close" use history.back() (so the browser's back
 * button and the red dot agree); otherwise closing replaces the entry with
 * the desktop. Pure, so it can be tested without a browser.
 */

export type NavKind = "push" | "replace" | "pop";

export function nextPreviousIsDesktop(
  current: boolean,
  kind: NavKind,
  from: { isDesktop: boolean },
  to: { isDesktop: boolean },
): boolean {
  if (to.isDesktop) return false;
  switch (kind) {
    case "push":
      return from.isDesktop;
    case "replace":
      return current;
    case "pop":
      // Windows are only ever pushed from the desktop, so going forward/back
      // onto a window means the entry before it is the desktop.
      return true;
  }
}
