"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useWindowNav } from "./useWindowNav";

/**
 * A real link to a window URL (crawlable, opens in a new tab with a modifier)
 * that opens the window in place: from the desktop it grows from this element,
 * from another window it replaces it.
 */
export function WindowLink({ href, onClick, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const { open } = useWindowNav();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(href, e.currentTarget);
  };
  return <Link href={href} scroll={false} onClick={handle} {...props} />;
}
