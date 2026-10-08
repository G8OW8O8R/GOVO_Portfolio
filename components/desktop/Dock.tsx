import type { ReactNode } from "react";
import type { Dictionary } from "@/content/dictionaries";
import { links } from "@/content/profile/links";
import { Icon, type GlyphName } from "@/components/ui/glyphs";
import { EmailLink } from "@/components/ui/Email";
import { WindowLink } from "@/components/window/WindowLink";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";

const item =
  "grid size-11 place-items-center rounded-[12px] text-ink transition-transform duration-150 ease-out hover:-translate-y-0.5 desk:size-12";

/** Dock item with a macOS-style name above it on hover / keyboard focus. */
function DockItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="group relative">
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-[7px] bg-ink/90 px-2.5 py-1 text-13 font-medium text-white opacity-0 shadow-[0_4px_12px_rgb(0_0_0/0.2)] transition-[opacity,translate] duration-150 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
      >
        {label}
      </span>
    </li>
  );
}

export function Dock({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const profiles: { glyph: GlyphName; label: string; url?: string }[] = [
    { glyph: "linkedin", label: dict.dock.linkedin, url: links.linkedin },
    { glyph: "github", label: dict.dock.github, url: links.github },
  ];
  const external = profiles.filter((l): l is { glyph: GlyphName; label: string; url: string } => !!l.url);

  return (
    <nav
      aria-label={dict.dock.label}
      data-dock=""
      data-intro-drop="late"
      className="fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 desk:bottom-5"
    >
      <ul className="flex items-center gap-1 rounded-[20px] bg-glass p-1.5 shadow-glass backdrop-blur-xl">
        {external.map(({ glyph, label, url }) => (
          <DockItem key={glyph} label={label}>
            <a className={item} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
              <Icon name={glyph} className="size-6.5" />
            </a>
          </DockItem>
        ))}
        <DockItem label={dict.dock.email}>
          <EmailLink className={item} fallbackHref={href(lang, "contact")} aria-label={dict.dock.email}>
            <Icon name="mail" className="size-6.5" />
          </EmailLink>
        </DockItem>
        <DockItem label={dict.dock.ask}>
          {/* The assistant arrives in task 5; until then it opens Contact. */}
          <WindowLink className={item} href={href(lang, "contact")} aria-label={dict.dock.ask}>
            <Icon name="chat" className="size-6.5" />
          </WindowLink>
        </DockItem>
      </ul>
    </nav>
  );
}
