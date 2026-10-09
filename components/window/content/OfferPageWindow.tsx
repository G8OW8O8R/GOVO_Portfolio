import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { getDictionary } from "@/content/dictionaries";
import { SUBJECT_PARAM } from "@/content/profile/contact";
import { pricing } from "@/content/profile/pricing";
import { workflow } from "@/content/profile/workflow";
import { getProject } from "@/content/projects";
import type { LocalPage, ServicePage } from "@/content/seo/schema";
import { servicePages } from "@/content/seo/services";
import { localPages } from "@/content/seo/local";
import type { Locale } from "@/lib/i18n";
import { requireImage } from "@/lib/image-manifest";
import { href } from "@/lib/routes";
import { packagesById } from "@/lib/seo";
import { PlayOnOpen } from "../motion/PlayOnOpen";
import { PreviewVideo } from "../motion/PreviewVideo";
import { RevealHeading } from "../motion/RevealHeading";
import { WindowLink } from "../WindowLink";
import { PackageRows } from "./price";
import { Section, Steps, Thumb, ui } from "./ui";

/*
 * Service and local pages: windows with their own h1 (the desktop's heading
 * steps back on these URLs). Read top to bottom: who it's for, what you get,
 * how I work, price and time, questions, then the one way to Contact. Each
 * kind of content keeps its own form: a light list beside its heading, rows
 * of one surface, the numbered path, the package rows of Pricing, questions
 * that open, the dark way out.
 */

type Text = { pl: string; en: string };

/** h1 and lead on the left, the page's picture beside them like a file's icon. */
function Header({ title, lead, thumb }: { title: string; lead: string; thumb: string }) {
  return (
    <header className="grid gap-6 desk:grid-cols-[minmax(0,1fr)_auto] desk:items-start desk:gap-12">
      <div>
        <RevealHeading
          as="h1"
          text={title}
          className="max-w-[18ch] text-balance text-40 font-semibold tracking-[-0.035em] text-ink desk:text-56"
        />
        <p className="mt-5 max-w-[52ch] text-pretty text-17 text-ink-soft desk:text-22 desk:tracking-[-0.015em]">{lead}</p>
      </div>
      <Thumb image={requireImage(thumb)} eager tilt className="row-start-1 aspect-square w-20 desk:row-auto desk:mt-2 desk:w-24" />
    </header>
  );
}

/** "Dla kogo": kinds of clients on a light ground, beside the heading. */
function ForWhom({ id, items, lang }: { id: string; items: readonly Text[]; lang: Locale }) {
  return (
    <Section id={id} title={getDictionary(lang).seo.forWhom} side level={2}>
      <ul className={`${ui.fill} divide-y divide-ink/10 px-6 desk:px-7`}>
        {items.map((item) => (
          <li key={item.pl} className="py-4 text-pretty text-17 text-ink">
            {item[lang]}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Rows of one surface: a short title beside its sentence. */
function Rows({ id, title, rows, lang }: { id: string; title: string; rows: readonly { title: Text; text: Text }[]; lang: Locale }) {
  return (
    <Section id={id} title={title} level={2}>
      <ul className={`${ui.surface} divide-y divide-win-line`}>
        {rows.map((item) => (
          <li key={item.title.pl} className="grid gap-1 px-5 py-5 desk:grid-cols-[220px_minmax(0,1fr)] desk:gap-8 desk:px-7">
            <h3 className="text-17 font-semibold tracking-[-0.015em] text-ink">{item.title[lang]}</h3>
            <p className="text-pretty text-15 text-ink-soft desk:text-17">{item.text[lang]}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * The same numbered path as How I work in About me, with the remote way of
 * working above it; `reach` (all of Poland, the world in English) on the
 * service pages, the Warsaw page says it after the meeting option instead.
 */
function HowIWork({ id, title, lang, reach = true, after }: { id: string; title: string; lang: Locale; reach?: boolean; after?: ReactNode }) {
  return (
    <Section id={id} title={title} level={2}>
      <p className={`${ui.lead} max-w-[48ch]`}>
        {reach && `${workflow.reach[lang]} `}
        {workflow.remote[lang]}
      </p>
      <Steps
        heading="h3"
        className="mt-8"
        items={workflow.steps.map((step) => ({ title: step.title[lang], text: step.text[lang] }))}
      />
      {after}
    </Section>
  );
}

/** Price and time from pricing.ts, the pricing note and the way to the full price list. */
function Price({ id, title, children, lang }: { id: string; title: string; children: ReactNode; lang: Locale }) {
  return (
    <Section id={id} title={title} level={2}>
      {children}
      {/* prices stay in PLN; in English one line on quotes from abroad */}
      {lang === "en" && <p className="mt-4 px-1 text-15 text-ink">{workflow.quoteEur}</p>}
      <p className="mt-4 max-w-[70ch] px-1 text-13 text-ink-soft">{pricing.footnote[lang]}</p>
      <p className="mt-3 px-1 text-15">
        <WindowLink href={href(lang, "pricing")} className={ui.link}>
          {getDictionary(lang).seo.pricing}&nbsp;→
        </WindowLink>
      </p>
    </Section>
  );
}

/** Questions that open; the FAQPage structured data is built from the same list. */
function Faq({ id, items, lang }: { id: string; items: readonly { q: Text; a: Text }[]; lang: Locale }) {
  return (
    <Section id={id} title={getDictionary(lang).seo.faq} side level={2}>
      <ul className={`${ui.surface} divide-y divide-win-line`}>
        {items.map((item, i) => (
          <li key={item.q.pl}>
            <details className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-surface px-5 py-5 desk:px-7 [&::-webkit-details-marker]:hidden">
                <span className="text-17 font-semibold tracking-[-0.015em] text-ink">{item.q[lang]}</span>
                <ChevronDown
                  className="mt-1 size-4 shrink-0 text-ink-soft transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="-mt-2 max-w-[62ch] text-pretty px-5 pb-6 text-15 text-ink-soft desk:px-7 desk:text-17">{item.a[lang]}</p>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** The one way out: Contact with the subject set. */
function Cta({ id, title, lang }: { id: string; title: string; lang: Locale }) {
  return (
    <section
      aria-labelledby={id}
      className={`${ui.dark} mt-16 grid gap-6 p-7 desk:mt-24 desk:grid-cols-[minmax(0,1fr)_auto] desk:items-end desk:p-10`}
    >
      <h2 id={id} className="max-w-[24ch] text-balance text-28 font-semibold tracking-[-0.03em] desk:text-40">
        {title}
      </h2>
      <WindowLink
        href={`${href(lang, "contact")}?${SUBJECT_PARAM}=strona`}
        className="inline-flex h-11 items-center justify-center justify-self-start rounded-full bg-white px-5 text-15 font-medium text-ink transition-colors hover:bg-white/90"
      >
        {getDictionary(lang).seo.talk}
      </WindowLink>
    </section>
  );
}

/** One line of links: the Obok case study, other services, the local page. */
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

const obokLink = (lang: Locale) => ({ href: href(lang, "project", "obok"), label: getDictionary(lang).seo.obok });

export function ServiceWindow({ page, lang }: { page: ServicePage; lang: Locale }) {
  const seo = getDictionary(lang).seo;
  const sid = (name: string) => `${page.id}-${name}`;
  const proof = page.proof && getProject(page.proof.project);

  return (
    <PlayOnOpen className={`${ui.page} max-w-[920px]`}>
      <article>
        <Header title={page.h1[lang]} lead={page.lead[lang]} thumb={page.thumb} />
        <ForWhom id={sid("for")} items={page.forWhom} lang={lang} />
        <Rows id={sid("includes")} title={seo.includes} rows={page.includes} lang={lang} />

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
                <PreviewVideo slug={proof.slug} cover={requireImage(`/projects/${proof.slug}/cover.jpg`)} />
              </WindowLink>
            </div>
          </Section>
        )}

        <HowIWork id={sid("work")} title={workflow.title[lang]} lang={lang} />
        <Price id={sid("price")} title={seo.price} lang={lang}>
          <PackageRows packages={packagesById(page.packages)} lang={lang} />
        </Price>
        <Faq id={sid("faq")} items={page.faq} lang={lang} />
        <Cta id={sid("cta")} title={page.cta[lang]} lang={lang} />
        <SeeAlso
          lang={lang}
          links={[
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
        <Header title={page.h1[lang]} lead={page.lead[lang]} thumb={page.thumb} />
        <Rows id={sid("for")} title={page.audiencesTitle[lang]} rows={page.audiences} lang={lang} />

        <HowIWork
          id={sid("work")}
          title={seo.together}
          lang={lang}
          reach={false}
          after={
            <div className={`${ui.fill} mt-4 grid gap-2 px-6 py-5 text-pretty desk:px-7`}>
              <p className="text-17 text-ink">{workflow.meet[lang]}</p>
              <p className="text-15 text-ink-soft">
                {workflow.beyond[lang]}{" "}
                <WindowLink href={href(lang, "offer")} className={ui.link}>
                  {seo.services}&nbsp;→
                </WindowLink>
              </p>
            </div>
          }
        />

        <Price id={sid("price")} title={seo.packages} lang={lang}>
          <PackageRows
            packages={packagesById(page.packages.map((p) => p.id))}
            lang={lang}
            name={(p) => (
              <WindowLink href={href(lang, "service", serviceOf.get(p.id)!)} className={ui.link}>
                {p.name[lang]}
              </WindowLink>
            )}
          />
        </Price>

        <Section id={sid("proof")} title={seo.proof} side level={2}>
          <p className={`${ui.body} max-w-[56ch] text-pretty`}>
            {page.proof[lang]}{" "}
            <WindowLink href={href(lang, "project", "obok")} className={ui.link}>
              {seo.proofLink}&nbsp;→
            </WindowLink>
          </p>
        </Section>

        <Faq id={sid("faq")} items={page.faq} lang={lang} />
        <Cta id={sid("cta")} title={page.cta[lang]} lang={lang} />
        <SeeAlso
          lang={lang}
          links={servicePages
            .filter((s) => !page.packages.some((p) => p.service === s.id))
            .map((s) => ({ href: href(lang, "service", s.id), label: s.name[lang] }))}
        />
      </article>
    </PlayOnOpen>
  );
}
