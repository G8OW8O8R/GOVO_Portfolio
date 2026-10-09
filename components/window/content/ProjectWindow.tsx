import { getDictionary } from "@/content/dictionaries";
import { SUBJECT_PARAM } from "@/content/profile/contact";
import type { Project } from "@/content/projects/schema";
import { trackAttrs } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import { requireImage } from "@/lib/image-manifest";
import { href } from "@/lib/routes";
import { Picture } from "@/components/ui/Picture";
import { PlayOnOpen } from "../motion/PlayOnOpen";
import { RevealHeading } from "../motion/RevealHeading";
import { ShowreelVideo } from "../motion/ShowreelVideo";
import { WindowLink } from "../WindowLink";
import { Section, ui } from "./ui";

/** Obok's orange with near-black text (contrast ~9:1), only on the live link. */
const amber =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-amber px-5 text-15 font-medium text-ink transition-[filter] hover:brightness-105";

function External({
  url,
  className,
  label,
  newTab,
  track,
}: {
  url: string;
  className: string;
  label: string;
  newTab: string;
  track?: Record<string, string>;
}) {
  return (
    <a href={url} target="_blank" rel="noopener" className={className} {...track}>
      {label}
      <span aria-hidden="true">↗</span>
      <span className="sr-only"> ({newTab})</span>
    </a>
  );
}

/**
 * Case study window, content from content/projects/<slug>:
 * title, subtitle, mono meta and the two links; the showreel with a warm
 * glow; then In short (three columns of one surface), the challenge, the
 * solutions (text and a still of the showreel, alternating sides), assets
 * with the scene gallery, technologies, numbers, what I learned and the
 * way to contact. Motion: the content enters once per opening of the
 * window and the title rises line by line from under its mask.
 */
export function ProjectWindow({ project, lang }: { project: Project; lang: Locale }) {
  const dict = getDictionary(lang);
  const s = dict.project.sections;
  const cs = project.caseStudy;
  const sid = (name: string) => `${project.slug}-${name}`;

  return (
    <PlayOnOpen className={`${ui.page} max-w-[920px]`}>
      <article>
        <header className="text-center">
          <RevealHeading text={project.title[lang]} className={ui.title} />
          <p className={`${ui.introText} mt-4 desk:text-22`}>{project.summary[lang]}</p>
          <p className="mt-4 text-balance font-mono text-13 text-ink-soft">{cs.meta[lang]}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <External
              url={cs.live.url}
              label={cs.live.label[lang]}
              newTab={dict.project.newTab}
              className={amber}
              track={trackAttrs(`${project.slug}-open-live`)}
            />
            {cs.code && (
              <External url={cs.code.url} label={cs.code.label[lang]} newTab={dict.project.newTab} className={ui.secondary} />
            )}
          </div>
        </header>

        {/* warm glow of Obok's light around the frame (static shadow, nothing animates) */}
        <ShowreelVideo
          {...cs.showreel}
          poster={requireImage(cs.showreel.poster)}
          labels={dict.project.showreel}
          className="mt-10 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_36px_90px_-24px_rgb(242_164_71/0.75),0_18px_40px_-18px_rgb(0_0_0/0.45)] desk:mt-12"
        />

        <Section id={sid("brief")} title={s.brief}>
          <div className={`${ui.surface} grid divide-y divide-win-line desk:grid-cols-3 desk:divide-x desk:divide-y-0`}>
            {cs.brief.map((item) => (
              <div key={item.title.pl} className="p-6 desk:p-7">
                <h4 className={ui.label}>{item.title[lang]}</h4>
                <p className="mt-2 text-pretty text-15 text-ink-soft">{item.text[lang]}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id={sid("challenge")} title={s.challenge} side>
          <p className={`${ui.lead} desk:text-28 desk:tracking-[-0.025em]`}>{cs.challenge[lang]}</p>
        </Section>

        <Section id={sid("solutions")} title={s.solutions}>
          <ol className="grid gap-12 desk:gap-16">
            {cs.solutions.map((item, i) => (
              <li key={item.title.pl} className="grid items-center gap-5 desk:grid-cols-2 desk:gap-10">
                <figure className={i % 2 ? "desk:order-2" : ""}>
                  <Picture
                    image={requireImage(item.shot.src)}
                    alt={item.shot.alt[lang]}
                    className="aspect-[16/10] w-full overflow-hidden rounded-[12px] bg-[#16181c] shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_18px_40px_-20px_rgb(0_0_0/0.45)]"
                  />
                </figure>
                <div>
                  <span className="font-mono text-13 text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                  <h4 className={`${ui.h3} mt-1`}>{item.title[lang]}</h4>
                  <p className={`${ui.body} mt-3 text-pretty`}>{item.text[lang]}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id={sid("assets")} title={s.assets}>
          <p className={`${ui.body} max-w-[62ch] text-pretty`}>{cs.assets.text[lang]}</p>
          {/* phone: a row that scrolls sideways inside the window; desktop: all five side by side */}
          <ul className="-mx-5 mt-7 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 desk:mx-0 desk:grid desk:grid-cols-5 desk:overflow-visible desk:px-0 desk:pb-0">
            {cs.assets.gallery.map((scene) => (
              <li key={scene.src} className="w-[38%] shrink-0 snap-start desk:w-auto">
                <figure>
                  {/* the 4:5 crop (lighthouse at 64 %) is in the generated files */}
                  <Picture
                    image={requireImage(scene.src)}
                    alt={scene.alt[lang]}
                    className="aspect-[4/5] w-full overflow-hidden rounded-[12px] bg-[#16181c] shadow-[0_0_0_1px_rgb(0_0_0/0.06)]"
                  />
                  {scene.caption && (
                    <figcaption className="mt-2 font-mono text-13 text-ink-soft">{scene.caption[lang]}</figcaption>
                  )}
                </figure>
              </li>
            ))}
          </ul>
        </Section>

        <Section id={sid("stack")} title={s.stack} side>
          <p className="font-mono text-15 leading-[1.7] text-ink">{cs.stack.join("  ·  ")}</p>
        </Section>

        {cs.numbers.length > 0 && (
          <Section id={sid("numbers")} title={s.numbers} side>
            <ul className={`${ui.fill} divide-y divide-win-line px-6`}>
              {cs.numbers.map((n) => (
                <li key={n.label.pl} className="grid grid-cols-[88px_minmax(0,1fr)] items-baseline gap-4 py-4 desk:grid-cols-[132px_minmax(0,1fr)]">
                  {n.value ? (
                    <span className="text-28 font-semibold tracking-[-0.03em] tabular-nums text-ink desk:text-40">{n.value}</span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <span className="text-pretty text-17 text-ink-soft">{n.label[lang]}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section id={sid("learned")} title={s.learned} side>
          <p className={`${ui.lead} desk:text-28 desk:tracking-[-0.025em]`}>{cs.learned[lang]}</p>
        </Section>

        <section
          aria-labelledby={sid("cta")}
          className={`${ui.dark} mt-16 grid gap-6 p-7 desk:mt-24 desk:grid-cols-[minmax(0,1fr)_auto] desk:items-end desk:p-10`}
        >
          <h3 id={sid("cta")} className="max-w-[22ch] text-balance text-28 font-semibold tracking-[-0.03em] desk:text-40">
            {cs.cta.title[lang]}
          </h3>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <WindowLink
              href={`${href(lang, "contact")}?${SUBJECT_PARAM}=strona`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-15 font-medium text-ink transition-colors hover:bg-white/90"
            >
              {cs.cta.button[lang]}
            </WindowLink>
            <WindowLink
              href={`${href(lang, "offer")}#${dict.tabs.offer.pricing.id}`}
              className="text-15 font-medium text-white underline decoration-white/40 underline-offset-[5px] transition-colors hover:decoration-white"
            >
              {cs.cta.pricing[lang]}&nbsp;→
            </WindowLink>
          </div>
        </section>
      </article>
    </PlayOnOpen>
  );
}
