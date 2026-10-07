import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { getDictionary } from "@/content/dictionaries";
import { BUDGET_PARAM, SUBJECT_PARAM } from "@/content/profile/contact";
import { offer } from "@/content/profile/offer";
import { pricing } from "@/content/profile/pricing";
import { getProject } from "@/content/projects";
import { priceParts } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { TabButton, Tabs } from "../Tabs";
import { WindowLink } from "../WindowLink";
import { Timeline, ui } from "./ui";

const EXPERIENCE_ID = "strony-z-doswiadczeniem";

export function OfferWindow({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const t = dict.tabs.offer;
  return (
    <Tabs label={dict.files.offer} tabs={[t.services, t.process, t.pricing]}>
      <ServicesPanel lang={lang} />
      <ProcessPanel lang={lang} />
      <PricingPanel lang={lang} />
    </Tabs>
  );
}

/** What I do – no prices here (they live only in Pricing). */
function ServicesPanel({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  return (
    <div className={ui.page}>
      <h2 className={ui.display}>{offer.servicesTitle[lang]}</h2>
      <p className={`mt-4 max-w-[34ch] ${ui.lead}`}>{offer.servicesLead[lang]}</p>

      <div className="mt-12 space-y-10">
        {offer.services.map((service, i) => (
          <section key={service.id} className="grid gap-x-6 desk:grid-cols-[44px_1fr]" aria-labelledby={`service-${service.id}`}>
            <span className="pt-1.5 font-mono text-13 tabular-nums text-ink-soft" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="max-w-[60ch]">
              <h3 id={`service-${service.id}`} className={ui.h3}>
                {service.title[lang]}
              </h3>
              <p className={`mt-2 ${ui.body}`}>{service.text[lang]}</p>
              <p className={`mt-2 ${ui.small}`}>{service.fit[lang]}</p>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-win-line pt-6 text-17 text-ink">
        {dict.offer.moreThanWebsite}{" "}
        <TabButton tab={dict.tabs.offer.pricing.id} target={EXPERIENCE_ID} className={ui.link}>
          {pricing.experience.name[lang]} →
        </TabButton>
      </p>
    </div>
  );
}

function ProcessPanel({ lang }: { lang: Locale }) {
  return (
    <div className={ui.page}>
      <h2 className={`mb-10 ${ui.display}`}>{offer.processTitle[lang]}</h2>
      <div className="max-w-[60ch]">
        <Timeline items={offer.process.map((step) => ({ title: step.title[lang], text: step.text[lang] }))} />
      </div>
    </div>
  );
}

/** "od" small, amount large (mono, tabular), currency small. */
function Price({
  value,
  lang,
  perMonth = false,
  dark = false,
  className = "",
}: {
  value: number;
  lang: Locale;
  perMonth?: boolean;
  dark?: boolean;
  className?: string;
}) {
  const p = priceParts(value, lang, perMonth);
  const small = `text-13 ${dark ? "text-white/60" : "text-ink-soft"}`;
  return (
    <span className={`inline-flex items-baseline gap-1.5 whitespace-nowrap font-mono tabular-nums ${className}`}>
      <span className={small}>{p.from}</span>
      {p.currencyFirst && <span className={small}>{p.currency}</span>}
      <span className={`text-22 font-medium tracking-[-0.03em] desk:text-28 ${dark ? "text-white" : "text-ink"}`}>
        {/* thousands apart by a narrow gap, not a full mono cell */}
        {p.amount.split("\u00a0").map((group, i) => (
          <span key={i} className={i ? "ml-[0.18em]" : undefined}>
            {group}
          </span>
        ))}
      </span>
      {!p.currencyFirst && <span className={small}>{p.currency}</span>}
      {p.per && <span className={small}>{p.per}</span>}
    </span>
  );
}

const row = "grid gap-x-6 gap-y-2 py-5 desk:grid-cols-[1fr_170px_180px] desk:items-baseline";

function PricingPanel({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const exp = pricing.experience;
  const proof = getProject(exp.proofProject);
  const contact = href(lang, "contact");
  // one root element: a server fragment reaches the client Tabs as an unkeyed array
  return (
    <div>
      <div className={`${ui.page} pb-10`}>
        <h2 className={ui.display}>{pricing.headline[lang]}</h2>
        <p className={`mt-4 max-w-[52ch] ${ui.body}`}>{pricing.lead[lang]}</p>
        <p className="mt-3 max-w-[60ch] text-17 text-ink">
          {pricing.smallBudget.text[lang]}{" "}
          <WindowLink href={`${contact}?${BUDGET_PARAM}=do-1000&${SUBJECT_PARAM}=strona`} className={ui.link}>
            {pricing.smallBudget.cta[lang]} →
          </WindowLink>
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-15 font-medium text-ink">
          {pricing.perks.map((perk, i) => (
            <li key={perk.pl} className="flex items-baseline gap-2">
              <span className="font-mono text-13 text-ink-soft" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              {perk[lang]}
            </li>
          ))}
        </ul>

        <ul className="mt-10 border-t border-ink">
          {pricing.packages.map((p) => (
            <li key={p.id} className="border-b border-win-line">
              <details className="group">
                <summary className={`${row} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-22 font-semibold tracking-[-0.02em] text-ink">{p.name[lang]}</span>
                      {p.popular && (
                        <span className="rounded-full bg-ink px-2.5 py-0.5 font-mono text-13 text-white">
                          {pricing.popularBadge[lang]}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-15 text-ink-soft">{p.description[lang]}</span>
                  </span>
                  <span className="font-mono text-13 text-ink-soft">
                    <span className="sr-only">{dict.offer.time}: </span>
                    {p.time[lang]}
                  </span>
                  <span className="flex items-baseline justify-between gap-3 desk:justify-end">
                    <Price value={p.from} lang={lang} />
                    <ChevronDown
                      className="size-4 shrink-0 self-center text-ink-soft transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </span>
                </summary>
                <ul className="-mt-1 grid gap-1.5 pb-6 text-15 text-ink desk:max-w-[60%]">
                  {p.features.map((f) => (
                    <li key={f.pl} className="flex gap-3">
                      <span className="mt-[0.7em] h-px w-3 shrink-0 bg-ink/40" aria-hidden="true" />
                      {f[lang]}
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
          <li className={`${row} border-b border-win-line`}>
            <span>
              <span className="text-17 font-semibold text-ink">{pricing.care.name[lang]}</span>
              <span className="mt-1 block text-15 text-ink-soft">{pricing.care.description[lang]}</span>
            </span>
            <span aria-hidden="true" className="hidden desk:block" />
            <span className="desk:text-right">
              <Price value={pricing.care.fromMonthly} lang={lang} perMonth />
            </span>
          </li>
        </ul>
      </div>

      <section
        id={EXPERIENCE_ID}
        className="scroll-mt-14 bg-ink text-white"
        aria-labelledby="experience-title"
      >
        <div className="mx-auto grid max-w-[780px] gap-8 px-6 py-12 desk:grid-cols-[1fr_minmax(0,300px)] desk:items-center desk:px-12 desk:py-14">
          <div>
            <h3 id="experience-title" className="text-28 font-semibold tracking-[-0.03em] desk:text-40">
              {exp.name[lang]}
            </h3>
            <Price value={exp.from} lang={lang} dark className="mt-3" />
            <p className="mt-4 max-w-[52ch] text-17 text-white/75">{exp.description[lang]}</p>
            <p className="mt-4 font-mono text-13 text-white/60">{exp.features.map((f) => f[lang]).join("  ·  ")}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <WindowLink
                href={`${contact}?${BUDGET_PARAM}=8-tys&${SUBJECT_PARAM}=strona`}
                className="inline-flex h-11 items-center rounded-full bg-white px-5 text-15 font-medium text-ink transition-colors hover:bg-white/85"
              >
                {exp.cta[lang]}
              </WindowLink>
              {proof && (
                <WindowLink
                  href={href(lang, "project", proof.slug)}
                  className="text-15 font-medium text-white underline decoration-white/40 underline-offset-[5px] hover:decoration-white"
                >
                  {dict.offer.seeProject} →
                </WindowLink>
              )}
            </div>
          </div>
          {proof && (
            <WindowLink href={href(lang, "project", proof.slug)} className="group block" aria-label={`${dict.offer.seeProject}`}>
              <Image
                src={`/projects/${proof.slug}/cover.jpg`}
                alt=""
                width={2576}
                height={1438}
                sizes="(max-width: 767px) 90vw, 300px"
                className="h-auto w-full rounded-[10px] shadow-[0_20px_50px_rgb(0_0_0/0.5)] transition-transform duration-300 group-hover:-translate-y-0.5"
              />
              <span className="mt-2.5 block font-mono text-13 text-white/60">
                {exp.proofLabel[lang]} {proof.title[lang]}
              </span>
            </WindowLink>
          )}
        </div>
      </section>

      <div className={`${ui.page} pt-6`}>
        <p className="max-w-[70ch] text-13 text-ink-soft">{pricing.footnote[lang]}</p>
      </div>
    </div>
  );
}
