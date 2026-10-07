import Link from "next/link";
import type { Dictionary } from "@/content/dictionaries";
import { links } from "@/content/profile/links";
import { Icon, type GlyphName } from "@/components/ui/glyphs";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";

const item =
  "grid size-11 place-items-center rounded-[12px] text-ink transition-colors hover:bg-white/55 desk:size-12";

export function Dock({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const external: { glyph: GlyphName; label: string; url: string }[] = [
    { glyph: "linkedin", label: dict.dock.linkedin, url: links.linkedin },
    { glyph: "github", label: dict.dock.github, url: links.github },
  ];

  return (
    <nav
      aria-label={dict.dock.label}
      className="fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 desk:bottom-5"
    >
      <ul className="flex items-center gap-1 rounded-[20px] border border-glass-border bg-glass p-1.5 shadow-glass backdrop-blur-xl">
        {external.map(({ glyph, label, url }) => (
          <li key={glyph}>
            <a className={item} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
              <Icon name={glyph} className="size-6.5" />
            </a>
          </li>
        ))}
        <li>
          <a className={item} href={`mailto:${links.email}`} aria-label={dict.dock.email} title={dict.dock.email}>
            <Icon name="mail" className="size-6.5" />
          </a>
        </li>
        <li>
          {/* The assistant arrives in task 5; until then it opens Contact. */}
          <Link className={item} href={href(lang, "contact")} aria-label={dict.dock.ask} title={dict.dock.ask}>
            <Icon name="chat" className="size-6.5" />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
