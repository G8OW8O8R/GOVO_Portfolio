"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { switchLocalePath } from "@/lib/routes";

export function LangSwitch({ lang, label, title }: { lang: Locale; label: string; title: string }) {
  const target: Locale = lang === "pl" ? "en" : "pl";
  const pathname = usePathname();
  const router = useRouter();
  const to = switchLocalePath(pathname, target);
  // the other language loads when the visitor reaches for it, not with the page
  const prefetch = () => router.prefetch(to);

  return (
    <Link
      href={to}
      prefetch={false}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      hrefLang={target}
      lang={target}
      aria-label={`${label} – ${title}`}
      className="grid size-9 place-items-center rounded-full text-[13px] font-semibold tracking-wide text-ink-muted hover:text-ink"
    >
      {label}
    </Link>
  );
}
