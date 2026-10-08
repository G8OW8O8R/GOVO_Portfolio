import type { Dictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { Logo } from "@/components/ui/Logo";
import { LogoLink } from "@/components/ui/LogoLink";
import { WindowLink } from "@/components/window/WindowLink";
import { LangSwitch } from "./LangSwitch";

export function TopBar({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between px-4 desk:h-auto desk:px-8 desk:pt-5">
      {/* data-dim on the small pieces: a screen-wide blurred layer costs frames */}
      <LogoLink href={href(lang, "home")} className="block h-8 text-ink desk:h-11" label={dict.desktop.homeLabel}>
        <Logo className="block h-full" />
      </LogoLink>

      <div data-dim="" className="flex items-center gap-2 desk:gap-4">
        <LangSwitch lang={lang} label={dict.language.switchTo} title={dict.language.switchLabel} />
        <WindowLink
          href={href(lang, "contact")}
          data-window-anchor="contact"
          data-intro-drop="late"
          className="flex h-10 items-center gap-2.5 rounded-full bg-ink px-4 text-15 font-medium leading-none text-white shadow-[0_8px_24px_-6px_rgb(0_0_0/0.45)] transition-colors hover:bg-[#2a2a2a] desk:h-11 desk:px-5"
        >
          <span className="relative size-2 rounded-full bg-available shadow-[0_0_0_3px_rgb(47_191_90/0.3)]" aria-hidden="true" />
          <span className="sr-only">{dict.workWithMe.availability}. </span>
          {dict.workWithMe.label}
        </WindowLink>
      </div>
    </header>
  );
}
