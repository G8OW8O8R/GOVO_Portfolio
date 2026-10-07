import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/content/dictionaries";
import { about } from "@/content/profile/about";
import { skills } from "@/content/profile/skills";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { hasCv, optionalAsset } from "@/lib/site";
import { Tabs } from "../Tabs";
import { WindowLink } from "../WindowLink";
import { Thumb, ui } from "./ui";

export function AboutWindow({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const t = dict.tabs.about;
  return (
    <Tabs label={dict.files.about} tabs={[t.about, t.skills]}>
      <AboutPanel lang={lang} />
      <SkillsPanel lang={lang} />
    </Tabs>
  );
}

function CvLink({ lang, label, className }: { lang: Locale; label: string; className: string }) {
  if (!hasCv()) return null;
  return (
    <WindowLink href={href(lang, "cv")} className={className}>
      {label}
    </WindowLink>
  );
}

function AboutPanel({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  return (
    <div className={ui.page}>
      <div className="grid items-start gap-5 desk:grid-cols-[1.25fr_1fr] desk:gap-8">
        <div>
          <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink">{about.name}</h2>
          <p className="mt-0.5 text-[14.5px] text-ink-soft">{about.role[lang]}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {about.facts.map((f) => (
              <li key={f.pl} className={ui.pill}>
                {f[lang]}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[21px] font-medium leading-[1.3] tracking-[-0.015em] text-ink desk:text-[23px]">
            {about.lead[lang]}
          </p>
        </div>
        <aside className="rounded-2xl border border-accent/25 bg-accent-soft p-5">
          <p className={`${ui.eyebrow} !text-accent`}>{about.seeking.label[lang]}</p>
          <p className="mt-2 text-[15.5px] leading-relaxed text-ink">
            <strong className="font-semibold">{about.seeking.strong[lang]}</strong> {about.seeking.rest[lang]}
          </p>
        </aside>
      </div>

      <div className="mt-8 max-w-[68ch] space-y-4">
        {about.text.map((p) => (
          <p key={p.pl.slice(0, 24)} className={ui.body}>
            {p[lang]}
          </p>
        ))}
      </div>

      <section className="mt-9" aria-labelledby="how-i-work">
        <h3 id="how-i-work" className={ui.eyebrow}>
          {about.howIWork.label[lang]}
        </h3>
        <ul className="mt-3 grid gap-3 desk:grid-cols-3">
          {about.howIWork.points.map((point) => (
            <li key={point.title.pl} className={`${ui.card} p-4`}>
              <p className="text-[15px] font-semibold text-ink">{point.title[lang]}</p>
              <p className="mt-1 text-[14px] leading-snug text-ink-soft">{point.text[lang]}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-9 flex flex-col items-start gap-4 border-t border-win-line pt-6 desk:flex-row desk:items-center desk:justify-between">
        <p className="max-w-[46ch] text-[16px] text-ink">{about.closing[lang]}</p>
        <div className="flex flex-wrap gap-2">
          <WindowLink href={href(lang, "contact")} className={ui.primary}>
            {dict.workWithMe.label}
          </WindowLink>
          <CvLink lang={lang} label={dict.about.seeCv} className={ui.secondary} />
        </div>
      </div>
    </div>
  );
}

const note = "rounded-full bg-win-card px-3 py-1 text-[13.5px] text-ink";

function SkillsPanel({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  return (
    <div className={ui.page}>
      <header className="text-center">
        <h2 className="text-[32px] font-bold leading-tight tracking-[-0.025em] text-ink desk:text-[38px]">
          {skills.title[lang]}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[56ch] text-balance text-[16px] text-ink-soft desk:text-[17px]">{skills.lead[lang]}</p>
      </header>

      {skills.categories.map((category, ci) => (
        <section key={category.id} className="mt-8" aria-labelledby={`skills-${category.id}`}>
          <h3 id={`skills-${category.id}`} className={ui.eyebrow}>
            <span className="tabular-nums">{String(ci + 1).padStart(2, "0")}</span> · {category.label[lang]}
          </h3>
          <ul className="mt-1">
            {category.skills.map((skill) => (
              <li
                key={skill.id}
                className="grid grid-cols-[1fr_64px] items-center gap-x-4 gap-y-2 border-b border-win-line py-3 last:border-b-0 desk:grid-cols-[1fr_auto_76px]"
              >
                <div className="min-w-0">
                  <p className="text-[18px] leading-tight tracking-[-0.01em] text-ink desk:text-[20px]">{skill.name[lang]}</p>
                  <ul className="mt-2 flex flex-wrap gap-1" aria-label={skill.name[lang]}>
                    {skill.tags.map((tag) => (
                      <li key={tag.pl} className={ui.tag}>
                        {tag[lang]}
                      </li>
                    ))}
                  </ul>
                  <p className={`${note} mt-2 inline-block desk:hidden`}>{skill.note[lang]}</p>
                </div>
                <p className={`${note} hidden whitespace-nowrap desk:block`}>{skill.note[lang]}</p>
                <Thumb
                  src={optionalAsset(`/skills/${skill.id}.png`)}
                  sizes="76px"
                  className="aspect-square w-full"
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-10" aria-labelledby="skills-workflow">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 id="skills-workflow" className={ui.eyebrow}>
            {skills.workflow.label[lang]}
          </h3>
          <p className="text-[13px] text-ink-soft">{skills.workflow.caption[lang]}</p>
        </div>
        <ol className="mt-3 grid items-center gap-3 desk:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {skills.workflow.steps.map((step, i) => (
            <li key={step.id} className="contents">
              {i > 0 && <ArrowRight className="mx-auto hidden size-5 text-ink-soft desk:block" aria-hidden="true" />}
              <div className="text-center">
                <Thumb src={optionalAsset(`/skills/${step.id}.png`)} sizes="(max-width: 767px) 90vw, 260px" className="aspect-[16/10] w-full" />
                <p className="mt-2 text-[14.5px] font-medium text-ink">{step.title[lang]}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-5 max-w-[62ch] text-center text-[14.5px] leading-relaxed text-ink">{skills.workflow.note[lang]}</p>
      </section>

      <div className="mt-8 flex justify-center">
        <CvLink lang={lang} label={dict.about.seeCv} className={ui.secondary} />
      </div>
    </div>
  );
}
