import { Suspense } from "react";
import { getDictionary } from "@/content/dictionaries";
import { about } from "@/content/profile/about";
import { links } from "@/content/profile/links";
import { Icon } from "@/components/ui/glyphs";
import type { Locale } from "@/lib/i18n";
import { ContactEmail, ContactEmailWithBudget } from "./ContactEmail";
import { ui } from "./ui";

/** Contact: e-mail and profiles for now; the form arrives in task 5. */
export function ContactWindow({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const profiles = [
    { glyph: "linkedin" as const, label: dict.dock.linkedin, url: links.linkedin },
    { glyph: "github" as const, label: dict.dock.github, url: links.github },
  ].filter((p): p is typeof p & { url: string } => !!p.url);

  return (
    <div className={`${ui.page} max-w-[620px] desk:pt-10`}>
      <h2 className="text-center text-[30px] font-bold tracking-[-0.025em] text-ink desk:text-[34px]">{dict.workWithMe.label}</h2>
      <p className="mx-auto mt-2 max-w-[44ch] text-center text-[16px] text-ink-soft">{about.closing[lang]}</p>

      <Suspense fallback={<ContactEmail labels={dict.contact} />}>
        <ContactEmailWithBudget lang={lang} labels={dict.contact} />
      </Suspense>

      {profiles.length > 0 && (
        <section className="mt-6" aria-labelledby="contact-profiles">
          <h3 id="contact-profiles" className={`${ui.eyebrow} text-center`}>
            {dict.contact.profiles}
          </h3>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {profiles.map((p) => (
              <li key={p.glyph}>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className={ui.secondary}>
                  <Icon name={p.glyph} className="size-5" />
                  {p.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
