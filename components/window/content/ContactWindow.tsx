import { Suspense } from "react";
import { getDictionary } from "@/content/dictionaries";
import { links } from "@/content/profile/links";
import { Icon } from "@/components/ui/glyphs";
import type { Locale } from "@/lib/i18n";
import { ContactForm, ContactFormWithParams, PreferEmail } from "./ContactForm";
import { AvailableDot, ui } from "./ui";

/** Contact: the form, the e-mail as a fallback line, profiles as small icons. */
export function ContactWindow({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const profiles = [
    { glyph: "linkedin" as const, label: dict.dock.linkedin, url: links.linkedin },
    { glyph: "github" as const, label: dict.dock.github, url: links.github },
  ].filter((p): p is typeof p & { url: string } => !!p.url);

  return (
    <div className={ui.page}>
      <header className="text-center">
        <h2 className={ui.display}>{dict.workWithMe.label}</h2>
        <p className={`${ui.introText} max-w-[46ch]`}>{dict.contact.lead}</p>
        <p className="mt-4 flex items-center justify-center gap-2.5 text-13 font-medium text-ink">
          <AvailableDot className="size-2" />
          {dict.workWithMe.availability}
        </p>
      </header>

      <div className={`${ui.surface} mx-auto mt-8 max-w-[680px] p-5 desk:p-8`}>
        <Suspense fallback={<ContactForm lang={lang} labels={dict.contact} />}>
          <ContactFormWithParams lang={lang} labels={dict.contact} />
        </Suspense>
      </div>

      <div className="mx-auto mt-6 flex max-w-[680px] flex-wrap items-center justify-between gap-4 px-1">
        <PreferEmail labels={dict.contact} />
        {profiles.length > 0 && (
          <ul className="flex gap-1">
            {profiles.map((p) => (
              <li key={p.glyph}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={p.label}
                  title={p.label}
                  className="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-black/[0.04] hover:text-ink"
                >
                  <Icon name={p.glyph} className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
