import { ChevronDown } from "lucide-react";
import { getDictionary } from "@/content/dictionaries";
import { BUDGET_PARAM, SUBJECT_PARAM } from "@/content/profile/contact";
import { pricing } from "@/content/profile/pricing";
import { getProject } from "@/content/projects";
import { serviceForPackage } from "@/content/seo/services";
import { keepRanges } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { PreviewVideo } from "../motion/PreviewVideo";
import { PricingTitle } from "../motion/PricingTitle";
import { WindowLink } from "../WindowLink";
import { Price, packageRow as row } from "./price";
import { ui } from "./ui";

/**
 * Pricing, all from pricing.ts: the Pricing tab of the Offer and the pricing
 * page, which adds its own h1 (`heading`, a small line above the two-line
 * title). Each expanded package links to its service page.
 */
export function PricingContent({ lang, heading }: { lang: Locale; heading?: string }) {
  const dict = getDictionary(lang);
  const soul = pricing.soul;
  const proof = getProject(soul.project);
  const contact = href(lang, "contact");
  // one root element: a server fragment reaches the client Tabs as an unkeyed array
  return (
    <div className={ui.page}>
      {heading && <h1 className="mb-4 text-center text-15 font-semibold tracking-[-0.01em] text-ink-soft">{heading}</h1>}
      <PricingTitle strong={pricing.headline.strong[lang]} struck={pricing.headline.struck[lang]} />
      <p className={`${ui.introText} mt-5`}>{keepRanges(pricing.lead[lang])}</p>
      <p className="mx-auto mt-4 max-w-[62ch] text-balance text-center font-mono text-13 text-ink-soft">
        {keepRanges(pricing.perks.map((perk) => perk[lang]).join("  ·  "))}
      </p>

      {/* every website has a soul: the dark block opens the pricing, before the packages */}
      <section
        className={`${ui.dark} mt-10 grid gap-7 p-6 desk:grid-cols-[minmax(0,1fr)_minmax(0,320px)] desk:items-center desk:gap-10 desk:p-9`}
        aria-labelledby="soul-title"
      >
        <div>
          <h3 id="soul-title" className="text-balance text-22 font-semibold tracking-[-0.025em] desk:text-28">
            {soul.title[lang]}
          </h3>
          <p className="mt-3 max-w-[52ch] text-17 text-white/75">{soul.text[lang]}</p>
          <p className="mt-5 font-mono text-13 text-white/60">{soul.points.map((point) => point[lang]).join("  ·  ")}</p>
        </div>
        {proof && (
          <WindowLink href={href(lang, "project", proof.slug)} className="group block">
            <PreviewVideo slug={proof.slug} sizes="(max-width: 767px) 90vw, 320px" />
            <span className="mt-3 block text-15 font-medium text-white underline decoration-white/40 underline-offset-[5px] transition-colors group-hover:decoration-white">
              {soul.caption[lang]}&nbsp;→
            </span>
          </WindowLink>
        )}
      </section>

      <p className="mt-10 max-w-[64ch] px-1 text-17 text-ink-soft">
        <strong className="font-semibold text-ink">{pricing.smallBudget.strong[lang]}</strong> {pricing.smallBudget.text[lang]}{" "}
        <WindowLink href={`${contact}?${BUDGET_PARAM}=do-1000&${SUBJECT_PARAM}=strona`} className={ui.link}>
          {pricing.smallBudget.cta[lang]}&nbsp;→
        </WindowLink>
      </p>

      <ul data-stagger="" className={`${ui.surface} mt-6 divide-y divide-win-line`}>
        {pricing.packages.map((p) => {
          const project = p.link ? getProject(p.link.project) : undefined;
          const service = serviceForPackage(p.id);
          return (
            <li key={p.id}>
              <details className="group">
                <summary className={`${row} cursor-pointer list-none rounded-surface [&::-webkit-details-marker]:hidden`}>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-22 font-semibold tracking-[-0.02em] text-ink">{p.name[lang]}</span>
                      {p.popular && (
                        <span className="rounded-[6px] bg-win-fill px-1.5 py-0.5 text-13 font-medium text-ink">
                          {pricing.popularBadge[lang]}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-15 text-ink-soft">{p.description[lang]}</span>
                  </span>
                  <span className="font-mono text-13 text-ink-soft">
                    <span className="sr-only">{dict.offer.time}: </span>
                    {keepRanges(p.time[lang])}
                  </span>
                  <span className="flex items-baseline justify-between gap-3 desk:justify-end">
                    <Price value={p.from} lang={lang} />
                    <ChevronDown
                      className="size-4 shrink-0 self-center text-ink-soft transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </span>
                </summary>
                <div className="-mt-1 px-5 pb-6 desk:px-7">
                  <ul className="grid gap-1.5 text-15 text-ink desk:max-w-[70%]">
                    {p.features.map((f) => (
                      <li key={f.pl} className="flex gap-3">
                        <span className="mt-[0.7em] h-px w-3 shrink-0 bg-ink/40" aria-hidden="true" />
                        {f[lang]}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-15">
                    {service && (
                      <WindowLink href={href(lang, "service", service.id)} className={ui.link}>
                        {dict.seo.packageDetails}&nbsp;→
                      </WindowLink>
                    )}
                    {p.link && project && (
                      <WindowLink href={href(lang, "project", project.slug)} className={ui.link}>
                        {p.link.label[lang]}&nbsp;→
                      </WindowLink>
                    )}
                  </p>
                </div>
              </details>
            </li>
          );
        })}
        <li className={row}>
          <span>
            <span className="text-17 font-semibold text-ink">{pricing.care.name[lang]}</span>
            <span className="mt-1 block text-15 text-ink-soft">{pricing.care.description[lang]}</span>
          </span>
          <span aria-hidden="true" className="hidden desk:block" />
          <span className="desk:pr-7 desk:text-right">
            <Price value={pricing.care.fromMonthly} lang={lang} perMonth />
          </span>
        </li>
      </ul>

      <p className="mt-6 max-w-[70ch] px-1 text-13 text-ink-soft">{pricing.footnote[lang]}</p>
    </div>
  );
}
