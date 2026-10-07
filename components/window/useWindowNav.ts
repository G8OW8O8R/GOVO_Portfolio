"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { closeMode, href, openMode, windowKeyForPath } from "@/lib/routes";
import { windowStore, type ExitMode } from "./store";
import { expectNavigation } from "./WindowHistory";

/** Opening and closing windows: one window at a time, back closes. */
export function useWindowNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [, maybeLang = ""] = pathname.split("/");
  const lang = isLocale(maybeLang) ? maybeLang : defaultLocale;

  const open = useCallback(
    (target: string, origin?: Element | null) => {
      if (target === pathname) return;
      windowStore.setOrigin(origin ?? null);
      const mode = openMode(windowKeyForPath(pathname) !== null);
      expectNavigation(mode);
      if (mode === "push") router.push(target, { scroll: false });
      else router.replace(target, { scroll: false });
    },
    [pathname, router],
  );

  const close = useCallback(
    (exit: ExitMode = "close") => {
      if (!windowKeyForPath(pathname)) return;
      windowStore.setExitMode(exit);
      if (closeMode(windowStore.previousIsDesktop) === "back") {
        router.back();
      } else {
        expectNavigation("replace");
        router.replace(href(lang, "home"), { scroll: false });
      }
    },
    [lang, pathname, router],
  );

  return { open, close, lang };
}
