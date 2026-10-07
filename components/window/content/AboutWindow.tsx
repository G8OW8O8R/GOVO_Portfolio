import { getDictionary } from "@/content/dictionaries";
import { about } from "@/content/profile/about";
import { skills } from "@/content/profile/skills";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { hasCv, optionalAsset } from "@/lib/site";
import { Tabs } from "../Tabs";
import { WindowLink } from "../WindowLink";
import { AvailableDot, Thumb, Timeline, ui } from "./ui";

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
      <header>
        <p className={ui.mono}>{about.role[lang]}</p>
        <h2 className={`mt-2 ${ui.display}`}>{about.name}</h2>
        <p className={`mt-4 max-w-[30ch] ${ui.lead}`}>{about.lead[lang]}</p>
        <p className={`mt-4 ${ui.mono}`}>{about.facts.map((f) => f[lang]).join("  ·  ")}</p>
      </header>

      <section className="mt-10" aria-labelledby="seeking">
        <h3 id="seeking" className={ui.label}>
          {about.seeking.label[lang]}
        </h3>
        <p className="mt-2 flex items-baseline gap-3.5 text-22 font-semibold tracking-[-0.025em] text-ink desk:text-28">
          <AvailableDot className="relative -top-1 desk:-top-1.5" />
          <span>{about.seeking.strong[lang]}</span>
        </p>
        <p className={`mt-2 max-w-[60ch] pl-6 ${ui.body}`}>{about.seeking.rest[lang]}</p>
      </section>

      <div className="mt-10 max-w-[64ch] space-y-4">
        {about.text.map((p) => (
          <p key={p.pl.slice(0, 24)} className={ui.body}>
            {p[lang]}
          </p>
        ))}
      </div>

      <section className="mt-12" aria-labelledby="how-i-work">
        <h3 id="how-i-work" className={`mb-5 ${ui.h3}`}>
          {about.howIWork.label[lang]}
        </h3>
        <Timeline items={about.howIWork.points.map((p) => ({ title: p.title[lang], text: capitalize(p.text[lang]) }))} />
      </section>

      <div className="mt-12 border-t border-win-line pt-8">
        <p className="max-w-[40ch] text-22 font-medium tracking-[-0.02em] text-ink">{about.closing[lang]}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <WindowLink href={href(lang, "contact")} className={ui.primary}>
            {dict.workWithMe.label}
          </WindowLink>
          <CvLink lang={lang} label={dict.about.seeCv} className={ui.secondary} />
        </div>
      </div>
    </div>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function SkillsPanel({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  return (
    <div className={ui.page}>
      <header>
        <h2 className={ui.display}>{skills.title[lang]}</h2>
        <p className={`mt-3 max-w-[52ch] ${ui.body}`}>{skills.lead[lang]}</p>
      </header>

      {skills.categories.map((category, ci) => (
        <section key={category.id} className="mt-12" aria-labelledby={`skills-${category.id}`}>
          <h3 id={`skills-${category.id}`} className="flex items-baseline gap-3 border-b border-ink pb-2.5">
            <span className="font-mono text-13 tabular-nums text-ink-soft">{String(ci + 1).padStart(2, "0")}</span>
            <span className={ui.label}>{category.label[lang]}</span>
          </h3>
          <ul>
            {category.skills.map((skill) => (
              <li
                key={skill.id}
                className="grid grid-cols-[1fr_56px] items-start gap-x-5 border-b border-win-line py-4 last:border-b-0 desk:grid-cols-[1fr_72px]"
              >
                <div className="min-w-0">
                  <p className="text-22 font-medium tracking-[-0.02em] text-ink">{skill.name[lang]}</p>
                  <p className="mt-0.5 text-15 text-ink-soft">{skill.note[lang]}</p>
                  <p className={`mt-2 ${ui.mono}`}>
                    <span className="sr-only">{skill.name[lang]}: </span>
                    {skill.tags.map((tag) => tag[lang]).join("  ·  ")}
                  </p>
                </div>
                <Thumb src={optionalAsset(`/skills/${skill.id}.png`)} sizes="72px" className="aspect-square w-full" />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-14" aria-labelledby="skills-workflow">
        <h3 id="skills-workflow" className={ui.h3}>
          {skills.workflow.label[lang]}
        </h3>
        <p className={`mt-1 ${ui.small}`}>{skills.workflow.caption[lang]}</p>
        <ol className="mt-5 grid gap-5 desk:grid-cols-3 desk:gap-4">
          {skills.workflow.steps.map((step, i) => (
            <li key={step.id}>
              <Thumb src={optionalAsset(`/skills/${step.id}.png`)} sizes="(max-width: 767px) 90vw, 240px" className="aspect-[16/10] w-full" />
              <p className="mt-2.5 flex items-baseline gap-2.5">
                <span className="font-mono text-13 tabular-nums text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-15 font-medium text-ink">{step.title[lang]}</span>
              </p>
            </li>
          ))}
        </ol>
        <p className={`mt-6 max-w-[62ch] ${ui.body}`}>{skills.workflow.note[lang]}</p>
      </section>

      <CvLink lang={lang} label={dict.about.seeCv} className={`mt-10 ${ui.secondary}`} />
    </div>
  );
}
