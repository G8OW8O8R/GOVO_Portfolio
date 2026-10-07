import Link from "next/link";
import type { Dictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { Logo } from "@/components/ui/Logo";
import { WindowLink } from "@/components/window/WindowLink";
import { LangSwitch } from "./LangSwitch";

export function TopBar({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between px-4 desk:h-auto desk:px-8 desk:pt-5">
      <Link href={href(lang, "home")} className="block h-8 text-ink desk:h-11" aria-label={dict.desktop.homeLabel}>
        <Logo className="block h-full" />
      </Link>

      <div className="flex items-center gap-2 desk:gap-4">
        <LangSwitch lang={lang} label={dict.language.switchTo} title={dict.language.switchLabel} />
        <WindowLink
          href={href(lang, "contact")}
          data-window-anchor="contact"
          className="flex items-center gap-2 rounded-full border border-glass-border bg-glass px-3.5 py-2 text-[14px] font-medium leading-none text-ink shadow-glass backdrop-blur-md desk:px-4.5 desk:py-2.5 desk:text-[15px]"
        >
          <span className="relative size-2 rounded-full bg-available shadow-[0_0_0_3px_rgb(47_191_90/0.18)]" aria-hidden="true" />
          <span className="sr-only">{dict.workWithMe.availability}. </span>
          {dict.workWithMe.label}
        </WindowLink>
      </div>
    </header>
  );
}
