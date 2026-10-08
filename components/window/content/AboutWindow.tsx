import { getDictionary } from "@/content/dictionaries";
import { about } from "@/content/profile/about";
import { skills } from "@/content/profile/skills";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { imageSet } from "@/lib/image-manifest";
import { hasCv } from "@/lib/site";
import { LIVE_DATA_SKILL, isLiveThumb } from "../live/ids";
import { LiveThumb } from "../live/LiveThumb";
import { LiveTicker } from "../live/LiveTicker";
import { RevealHeading } from "../motion/RevealHeading";
import { Tabs } from "../Tabs";
import { WindowLink } from "../WindowLink";
import { AvailableDot, Steps, Thumb, ui } from "./ui";

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
  if (!hasCv(lang)) return null;
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
      <div className="grid items-start gap-6 desk:grid-cols-[1.2fr_1fr] desk:gap-8">
        <header>
          <RevealHeading
            text={about.name}
            className="text-balance text-40 font-semibold tracking-[-0.035em] text-ink desk:text-56"
          />
          <p className="mt-1 text-15 text-ink-soft">{about.role[lang]}</p>
          <p className={`mt-3 ${ui.mono}`}>{about.facts.map((f) => f[lang]).join("  ·  ")}</p>
          <p className={`mt-5 ${ui.lead}`}>{about.lead[lang]}</p>
        </header>

        <section className={`${ui.fill} p-5 desk:p-6`} aria-labelledby="seeking">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <h3 id="seeking" className={ui.label}>
              {about.seeking.label[lang]}
            </h3>
            <p className="flex items-center gap-2 text-13 font-medium text-ink">
              <AvailableDot className="size-2" pulse />
              {about.seeking.status[lang]}
            </p>
          </div>
          <p className="mt-3 text-17 font-semibold tracking-[-0.01em] text-ink">{about.seeking.strong[lang]}</p>
          <p className="mt-1.5 text-15 text-ink-soft">{about.seeking.rest[lang]}</p>
        </section>
      </div>

      <div className="mt-10 max-w-[66ch] space-y-4">
        {about.text.map((p) => (
          <p key={p.pl.slice(0, 24)} className={ui.body}>
            {p[lang]}
          </p>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="how-i-work">
        <h3 id="how-i-work" className={`mb-4 ${ui.label}`}>
          {about.howIWork.label[lang]}
        </h3>
        <Steps items={about.howIWork.points.map((p) => ({ title: p.title[lang], text: capitalize(p.text[lang]) }))} />
      </section>

      <div className="mt-10 flex flex-col items-start gap-5 desk:flex-row desk:items-center desk:justify-between">
        <p className="max-w-[40ch] text-17 font-medium text-ink">{about.closing[lang]}</p>
        <div className="flex shrink-0 flex-wrap gap-2">
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
        <RevealHeading text={skills.title[lang]} className={ui.title} />
        <p className={ui.introText}>{skills.lead[lang]}</p>
      </header>

      {skills.categories.map((category, ci) => (
        <section key={category.id} className="mt-10" aria-labelledby={`skills-${category.id}`}>
          <h3 id={`skills-${category.id}`} className="mb-3 flex items-baseline gap-2.5 px-1">
            <span className="font-mono text-13 tabular-nums text-ink-soft">{String(ci + 1).padStart(2, "0")}</span>
            <span className={ui.label}>{category.label[lang]}</span>
          </h3>
          <ul data-stagger="" className={`${ui.surface} divide-y divide-win-line`}>
            {category.skills.map((skill) => (
              <li
                key={skill.id}
                className="grid grid-cols-[1fr_56px] items-center gap-x-5 px-5 py-4 desk:grid-cols-[1fr_72px] desk:px-6"
              >
                <div className="min-w-0">
                  <p className="flex items-baseline justify-between gap-4">
                    <span className="text-17 font-semibold tracking-[-0.01em] text-ink desk:text-22">{skill.name[lang]}</span>
                    {skill.id === LIVE_DATA_SKILL && <LiveTicker id={skill.id} lang={lang} label={dict.live.live} />}
                  </p>
                  <p className="mt-0.5 text-15 text-ink-soft">{skill.note[lang]}</p>
                  <p className={`mt-2 ${ui.mono}`}>
                    <span className="sr-only">{skill.name[lang]}: </span>
                    {skill.tags.map((tag) => tag[lang]).join("  ·  ")}
                  </p>
                </div>
                {isLiveThumb(skill.id) ? (
                  <LiveThumb id={skill.id} image={imageSet(`/skills/${skill.id}.png`)} className="aspect-square w-full" />
                ) : (
                  <Thumb image={imageSet(`/skills/${skill.id}.png`)} className="aspect-square w-full" eager tilt />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-12" aria-labelledby="skills-workflow">
        <h3 id="skills-workflow" className={`text-center ${ui.h3}`}>
          {skills.workflow.label[lang]}
        </h3>
        <p className={`mt-1 text-center ${ui.small}`}>{skills.workflow.caption[lang]}</p>
        <ol className={`${ui.surface} mt-5 grid gap-5 p-4 desk:grid-cols-3 desk:gap-4`}>
          {skills.workflow.steps.map((step, i) => (
            <li key={step.id}>
              <Thumb image={imageSet(`/skills/${step.id}.png`)} className="aspect-[16/10] w-full" tilt />
              <p className="mt-2.5 flex items-baseline gap-2.5 px-1">
                <span className="font-mono text-13 tabular-nums text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-15 font-medium text-ink">{step.title[lang]}</span>
              </p>
            </li>
          ))}
        </ol>
        <p className={`mx-auto mt-5 max-w-[62ch] text-center ${ui.small}`}>{skills.workflow.note[lang]}</p>
      </section>

      <div className="mt-8 flex justify-center">
        <CvLink lang={lang} label={dict.about.seeCv} className={ui.secondary} />
      </div>
    </div>
  );
}
