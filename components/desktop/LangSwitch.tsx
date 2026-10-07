"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { switchLocalePath } from "@/lib/routes";

export function LangSwitch({ lang, label, title }: { lang: Locale; label: string; title: string }) {
  const target: Locale = lang === "pl" ? "en" : "pl";
  const pathname = usePathname();

  return (
    <Link
      href={switchLocalePath(pathname, target)}
      hrefLang={target}
      lang={target}
      aria-label={`${label} – ${title}`}
      className="grid size-9 place-items-center rounded-full text-[13px] font-semibold tracking-wide text-ink-muted hover:text-ink"
    >
      {label}
    </Link>
  );
}
