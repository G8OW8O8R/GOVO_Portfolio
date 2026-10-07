import { Check, Eye, RefreshCw, Zap } from "lucide-react";
import { getDictionary } from "@/content/dictionaries";
import { BUDGET_PARAM } from "@/content/profile/contact";
import { offer } from "@/content/profile/offer";
import { pricing } from "@/content/profile/pricing";
import { getProject } from "@/content/projects";
import { formatPriceFrom } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { TabButton, Tabs } from "../Tabs";
import { WindowLink } from "../WindowLink";
import { ui } from "./ui";

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

function ServicesPanel({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const pricingTab = dict.tabs.offer.pricing.id;
  const exp = pricing.experience;
  const proof = getProject(exp.proofProject);
  return (
    <div className={ui.page}>
      <p className="mx-auto max-w-[36ch] text-balance text-center text-[22px] font-medium leading-[1.3] tracking-[-0.015em] text-ink desk:text-[25px]">
        {offer.servicesLead[lang]}
      </p>
      <ul className="mt-7 grid gap-3 desk:grid-cols-3">
        {pricing.packages.map((p) => (
          <li key={p.id} className={`${ui.card} flex flex-col p-5`}>
            <h3 className="text-[17px] font-semibold text-ink">{p.name[lang]}</h3>
            <p className="mt-1.5 flex-1 text-[14px] leading-snug text-ink-soft">{p.description[lang]}</p>
            <p className="mt-4 text-[15px] font-semibold text-ink">{formatPriceFrom(p.from, lang)}</p>
            <p className="text-[13px] text-ink-soft">
              {dict.offer.time}: {p.time[lang]}
            </p>
            <TabButton tab={pricingTab} className="mt-3 self-start text-[13.5px] font-medium text-accent underline-offset-4 hover:underline">
              {dict.offer.seePricing} →
            </TabButton>
          </li>
        ))}
        <li className="flex flex-col rounded-2xl bg-ink p-5 text-white">
          <h3 className="text-[17px] font-semibold">{exp.name[lang]}</h3>
          <p className="mt-1.5 flex-1 text-[14px] leading-snug text-white/75">{exp.description[lang]}</p>
          <p className="mt-4 text-[15px] font-semibold">{formatPriceFrom(exp.from, lang)}</p>
          {proof && (
            <WindowLink
              href={href(lang, "project", proof.slug)}
              className="mt-3 self-start text-[13.5px] font-medium text-white underline-offset-4 hover:underline"
            >
              {dict.offer.seeProject} →
            </WindowLink>
          )}
        </li>
      </ul>
    </div>
  );
}

function ProcessPanel({ lang }: { lang: Locale }) {
  return (
    <div className={ui.page}>
      <ol className="relative mx-auto max-w-[640px]">
        {offer.process.map((step, i) => (
          <li key={step.title.pl} className="relative grid grid-cols-[40px_1fr] gap-4 pb-7 last:pb-0">
            {i < offer.process.length - 1 && (
              <span className="absolute left-[19px] top-10 bottom-0 w-px bg-win-line" aria-hidden="true" />
            )}
            <span className="grid size-10 place-items-center rounded-full bg-win-card text-[13px] font-semibold tabular-nums text-ink" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="pt-1.5">
              <h3 className="text-[17px] font-semibold text-ink">{step.title[lang]}</h3>
              <p className={`mt-1 ${ui.body}`}>{step.text[lang]}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const perkIcons = { fast: Zap, progress: Eye, revisions: RefreshCw } as const;

function PricingPanel({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const exp = pricing.experience;
  const proof = getProject(exp.proofProject);
  const contact = href(lang, "contact");
  return (
    <div className={ui.page}>
      <p className="mx-auto max-w-[60ch] text-balance text-center text-[18px] leading-[1.45] text-ink desk:text-[19px]">{pricing.lead[lang]}</p>
      <ul className="mt-4 flex flex-wrap justify-center gap-2">
        {pricing.perks.map((perk) => {
          const PerkIcon = perkIcons[perk.icon];
          return (
            <li key={perk.icon} className="inline-flex items-center gap-1.5 rounded-full bg-win-card px-3 py-1.5 text-[13.5px] font-medium text-ink">
              <PerkIcon className="size-4 text-accent" aria-hidden="true" />
              {perk.text[lang]}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-accent/25 bg-accent-soft p-5 desk:flex-row desk:items-center desk:justify-between">
        <p className="text-[15px] leading-snug text-ink">
          <strong className="font-semibold">{pricing.smallBudget.strong[lang]}</strong> {pricing.smallBudget.rest[lang]}
        </p>
        <WindowLink href={`${contact}?${BUDGET_PARAM}=do-1000`} className={`${ui.primary} shrink-0`}>
          {pricing.smallBudget.cta[lang]}
        </WindowLink>
      </div>

      <ul className="mt-6 grid gap-3 desk:grid-cols-2">
        {pricing.packages.map((p) => (
          <li
            key={p.id}
            className={`relative flex flex-col rounded-2xl border bg-white p-5 ${p.popular ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-win-line"}`}
          >
            {p.popular && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[11.5px] font-semibold text-white">
                {pricing.popularBadge[lang]}
              </span>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[17px] font-semibold text-ink">{p.name[lang]}</h3>
              <p className="shrink-0 text-[16px] font-semibold text-ink">{formatPriceFrom(p.from, lang)}</p>
            </div>
            <p className="mt-1 text-[14px] leading-snug text-ink-soft">{p.description[lang]}</p>
            <ul className="mt-3 space-y-1.5">
              {p.features.map((f) => (
                <li key={f.pl} className="flex gap-2 text-[14px] leading-snug text-ink">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {f[lang]}
                </li>
              ))}
              <li className="flex gap-2 text-[14px] leading-snug text-ink-soft">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                {dict.offer.time}: {p.time[lang]}
              </li>
            </ul>
          </li>
        ))}
      </ul>

      <section className="mt-4 rounded-2xl bg-ink p-6 text-white desk:p-7" aria-labelledby="experience">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 id="experience" className="text-[20px] font-semibold tracking-[-0.01em]">
            {exp.name[lang]}
          </h3>
          <p className="text-[17px] font-semibold">{formatPriceFrom(exp.from, lang)}</p>
        </div>
        <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-white/80">{exp.description[lang]}</p>
        <ul className="mt-4 grid gap-1.5 desk:grid-cols-2">
          {exp.features.map((f) => (
            <li key={f.pl} className="flex gap-2 text-[14px] leading-snug">
              <Check className="mt-0.5 size-4 shrink-0 text-[#e9b46a]" aria-hidden="true" />
              {f[lang]}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <WindowLink href={contact} className={ui.primary}>
            {exp.cta[lang]}
          </WindowLink>
          {proof && (
            <p className="text-[14px] text-white/80">
              {exp.proofLabel[lang]}{" "}
              <WindowLink href={href(lang, "project", proof.slug)} className="font-medium text-white underline underline-offset-4">
                {proof.title[lang]}
              </WindowLink>
            </p>
          )}
        </div>
      </section>

      <p className="mt-4 flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border border-win-line px-5 py-3.5 text-[14px]">
        <span>
          <strong className="font-semibold text-ink">{pricing.care.name[lang]}</strong>{" "}
          <span className="text-ink-soft">– {pricing.care.description[lang]}</span>
        </span>
        <span className="font-semibold text-ink">{formatPriceFrom(pricing.care.fromMonthly, lang, true)}</span>
      </p>

      <p className="mt-5 text-[13px] leading-relaxed text-ink-soft">{pricing.footnote[lang]}</p>
    </div>
  );
}
