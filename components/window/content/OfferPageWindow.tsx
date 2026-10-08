import type { ReactNode } from "react";
import { getDictionary } from "@/content/dictionaries";
import { SUBJECT_PARAM } from "@/content/profile/contact";
import { getProject } from "@/content/projects";
import type { LocalPage, ServicePage } from "@/content/seo/schema";
import { getServicePage, servicePages } from "@/content/seo/services";
import { localPages } from "@/content/seo/local";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { packagesById } from "@/lib/seo";
import { PlayOnOpen } from "../motion/PlayOnOpen";
import { PreviewVideo } from "../motion/PreviewVideo";
import { RevealHeading } from "../motion/RevealHeading";
import { WindowLink } from "../WindowLink";
import { PackageRows } from "./price";
import { Section, ui } from "./ui";

/*
 * Service and local pages: windows with their own h1 (the desktop's heading
 * steps back on these URLs). Each kind of content keeps its own form: the
 * package rows of Pricing, one surface of rows for what you get, a lead
 * paragraph beside its heading, a light list of who it fits, the dark way
 * to Contact and one line of links to the related pages.
 */

function Header({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="text-center">
      <RevealHeading as="h1" text={title} className={ui.title} />
      <p className={`${ui.introText} mt-4 desk:text-22`}>{lead}</p>
    </header>
  );
}

function Focus({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Section id={id} title={title} side level={2}>
      {/* a lead beside its heading; 17 px on phones, where the paragraph runs long */}
      <div className="grid gap-4 text-pretty text-17 font-medium tracking-[-0.015em] text-ink desk:text-22 desk:tracking-[-0.02em]">
        {children}
      </div>
    </Section>
  );
}

/** "Sprawdzi się np. dla…" – kinds of clients, each item completes the heading. */
function Fit({ id, items, lang }: { id: string; items: readonly { pl: string; en: string }[]; lang: Locale }) {
  return (
    <Section id={id} title={getDictionary(lang).seo.fit} level={2}>
      <ul className={`${ui.fill} divide-y divide-win-line px-6 desk:px-7`}>
        {items.map((item) => (
          <li key={item.pl} className="py-4 text-pretty text-17 text-ink">
            {item[lang]}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** The one way out: Contact with the subject set. */
function Cta({ id, title, lang }: { id: string; title: string; lang: Locale }) {
  const seo = getDictionary(lang).seo;
  return (
    <section
      aria-labelledby={id}
      className={`${ui.dark} mt-16 grid gap-6 p-7 desk:mt-24 desk:grid-cols-[minmax(0,1fr)_auto] desk:items-end desk:p-10`}
    >
      <div>
        <h2 id={id} className="max-w-[24ch] text-balance text-28 font-semibold tracking-[-0.03em] desk:text-40">
          {title}
        </h2>
        <p className="mt-3 text-17 text-white/70">{seo.remote}</p>
      </div>
      <WindowLink
        href={`${href(lang, "contact")}?${SUBJECT_PARAM}=strona`}
        className="inline-flex h-11 items-center justify-center justify-self-start rounded-full bg-white px-5 text-15 font-medium text-ink transition-colors hover:bg-white/90"
      >
        {seo.talk}
      </WindowLink>
    </section>
  );
}

/** One line of links: pricing, related services, the Obok case study, the local page. */
function SeeAlso({ lang, links }: { lang: Locale; links: { href: string; label: string }[] }) {
  const seo = getDictionary(lang).seo;
  return (
    <nav aria-label={seo.seeAlso} className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 px-1 text-15">
      <span className="text-ink-soft">{seo.seeAlso}:</span>
      {links.map((link) => (
        <WindowLink key={link.href} href={link.href} className={ui.link}>
          {link.label}
        </WindowLink>
      ))}
    </nav>
  );
}

const pricingLink = (lang: Locale) => ({ href: href(lang, "pricing"), label: getDictionary(lang).seo.pricing });
const obokLink = (lang: Locale) => ({ href: href(lang, "project", "obok"), label: getDictionary(lang).seo.proofLink });

export function ServiceWindow({ page, lang }: { page: ServicePage; lang: Locale }) {
  const seo = getDictionary(lang).seo;
  const sid = (name: string) => `${page.id}-${name}`;
  const proof = page.proof && getProject(page.proof.project);
  const related = page.related.map((id) => getServicePage(id)!);

  return (
    <PlayOnOpen className={`${ui.page} max-w-[920px]`}>
      <article>
        <Header title={page.h1[lang]} lead={page.lead[lang]} />
        <PackageRows packages={packagesById(page.packages)} lang={lang} className="mt-10" />

        <Section id={sid("includes")} title={seo.includes} level={2}>
          <ul className={`${ui.surface} divide-y divide-win-line`}>
            {page.includes.map((item) => (
              <li key={item.title.pl} className="grid gap-1 px-5 py-5 desk:grid-cols-[240px_minmax(0,1fr)] desk:gap-8 desk:px-7">
                <h3 className="text-17 font-semibold tracking-[-0.015em] text-ink">{item.title[lang]}</h3>
                <p className="text-pretty text-15 text-ink-soft desk:text-17">{item.text[lang]}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Focus id={sid("focus")} title={page.focus.title[lang]}>
          <p>{page.focus.text[lang]}</p>
        </Focus>

        {page.proof && proof && (
          <Section id={sid("proof")} title={seo.proof} level={2}>
            <div className={`${ui.surface} grid gap-6 p-5 desk:grid-cols-[minmax(0,1fr)_minmax(0,360px)] desk:items-center desk:gap-10 desk:p-7`}>
              <div>
                <p className={`${ui.body} text-pretty`}>{page.proof.text[lang]}</p>
                <WindowLink href={href(lang, "project", proof.slug)} className={`${ui.link} mt-4 inline-block text-15`}>
                  {seo.proofLink}&nbsp;→
                </WindowLink>
              </div>
              {/* the same case study again, so the picture is not a second stop for the keyboard */}
              <WindowLink href={href(lang, "project", proof.slug)} tabIndex={-1} aria-hidden="true" className="block">
                <PreviewVideo slug={proof.slug} sizes="(max-width: 767px) 90vw, 360px" />
              </WindowLink>
            </div>
          </Section>
        )}

        <Fit id={sid("fit")} items={page.fit} lang={lang} />
        <Cta id={sid("cta")} title={page.cta[lang]} lang={lang} />
        <SeeAlso
          lang={lang}
          links={[
            pricingLink(lang),
            ...related.map((r) => ({ href: href(lang, "service", r.id), label: r.name[lang] })),
            ...(page.proof ? [] : [obokLink(lang)]),
            ...localPages.map((l) => ({ href: href(lang, "local", l.id), label: l.title[lang] })),
          ]}
        />
      </article>
    </PlayOnOpen>
  );
}

export function LocalWindow({ page, lang }: { page: LocalPage; lang: Locale }) {
  const seo = getDictionary(lang).seo;
  const sid = (name: string) => `${page.id}-${name}`;
  const serviceOf = new Map(page.packages.map((p) => [p.id, p.service]));

  return (
    <PlayOnOpen className={`${ui.page} max-w-[920px]`}>
      <article>
        <Header title={page.h1[lang]} lead={page.lead[lang]} />

        <Focus id={sid("meet")} title={page.meet.title[lang]}>
          <p>{page.meet.text[lang]}</p>
        </Focus>

        <Section id={sid("packages")} title={seo.packages} level={2}>
          <PackageRows
            packages={packagesById(page.packages.map((p) => p.id))}
            lang={lang}
            name={(p) => (
              <WindowLink href={href(lang, "service", serviceOf.get(p.id)!)} className={ui.link}>
                {p.name[lang]}
              </WindowLink>
            )}
          />
          <p className="mt-4 px-1 text-15">
            <WindowLink href={href(lang, "pricing")} className={ui.link}>
              {seo.pricing}&nbsp;→
            </WindowLink>
          </p>
        </Section>

        <Focus id={sid("focus")} title={page.focus.title[lang]}>
          <p>{page.focus.text[lang]}</p>
        </Focus>

        <Fit id={sid("fit")} items={page.fit} lang={lang} />
        <Cta id={sid("cta")} title={page.cta[lang]} lang={lang} />
        <SeeAlso
          lang={lang}
          links={[
            ...servicePages
              .filter((s) => !page.packages.some((p) => p.service === s.id))
              .map((s) => ({ href: href(lang, "service", s.id), label: s.name[lang] })),
            obokLink(lang),
          ]}
        />
      </article>
    </PlayOnOpen>
  );
}
