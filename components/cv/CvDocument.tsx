import Image from "next/image";
import { Fragment } from "react";
import { about } from "@/content/profile/about";
import { SITE_URL } from "@/content/profile/contact";
import { cv } from "@/content/profile/cv";
import { links } from "@/content/profile/links";
import { skills } from "@/content/profile/skills";
import { cvEntries } from "@/content/projects";
import { EmailLink, EmailText } from "@/components/ui/Email";
import { Steps, type StepsLook } from "@/components/window/motion/Steps";
import { cvProjectUrl, cvSkillGroups, displayUrl, selectCvProjects } from "@/lib/cv";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import s from "./cv.module.css";

/** The project timeline is the same component as Process / How I work, at printed sizes. */
const timeline: StepsLook = {
  list: s.timeline,
  item: s.step,
  line: s.stepLine,
  number: s.stepNumber,
  light: s.stepLight,
  body: s.stepBody,
  head: s.stepHead,
  title: s.stepTitle,
  meta: s.meta,
  text: s.stepText,
  tags: s.tags,
  heading: "h4",
  litNumberOnly: true,
};

/** Year of the build (static page): the footer of the printed CV. */
const year = new Date().getFullYear();

/**
 * The CV as one A4 page (window "CV.pdf", /pl/cv, /en/cv, the PDFs).
 * Real text in reading order for ATS: header → profile → projects → other
 * experience → right column → footer. On screen a sheet at real size; in a
 * narrow window (phone) it reflows to one column. Print styles: globals.css
 * isolates the sheet, cv.module.css sets the page.
 */
export function CvDocument({ lang }: { lang: Locale }) {
  const projects = selectCvProjects(cvEntries).map((entry) => {
    const url = cvProjectUrl(entry, lang, SITE_URL);
    return {
      title: entry.title[lang],
      text: entry.cv.summary[lang],
      tags: entry.cv.tags,
      meta: (
        <>
          {entry.year} · <a href={url}>{displayUrl(url)}</a>
        </>
      ),
    };
  });
  const profiles = [links.linkedin, links.github].filter((url): url is string => !!url);
  const interactive = `${SITE_URL}${href(lang, "cv")}`;
  const h = cv.headings;

  return (
    <article data-cv-sheet="" lang={lang} className={s.sheet}>
      <header className={s.header}>
        <div className={s.intro}>
          {/* eslint-disable-next-line @next/next/no-img-element -- vector logo, printed as vector */}
          <img src="/brand/logo.svg" alt="" width={1067} height={450} className={s.logo} />
          <h2 className={s.name}>{about.name}</h2>
          <p className={s.role}>{about.role[lang]}</p>
          <p className={s.available}>
            <span className={s.dot} aria-hidden="true" />
            {cv.available[lang]}
          </p>
          {/* items never break inside; a narrow window wraps after a "·" */}
          <p className={s.contact}>
            <span>{cv.location[lang]} ·</span>{" "}
            <span>
              <EmailLink fallbackHref={href(lang, "contact")} className={s.strong}>
                <EmailText />
              </EmailLink>
              {/* the line break of the sheet; one flowing line in a narrow window */}
              <span className={s.lineSep}> ·</span>
            </span>{" "}
            <br />
            {[SITE_URL, ...profiles].map((url, i, all) => (
              <Fragment key={url}>
                <span>
                  <a href={url} className={i === 0 ? s.strong : undefined}>
                    {displayUrl(url)}
                  </a>
                  {i < all.length - 1 && " ·"}
                </span>
                {i < all.length - 1 && " "}
              </Fragment>
            ))}
          </p>
        </div>
        <Image src={cv.photo} alt={about.name} width={800} height={1000} unoptimized priority className={s.photo} />
      </header>

      <div className={s.columns}>
        <div>
          <p className={s.lead}>{cv.profile[lang]}</p>

          <section>
            <h3 className={s.heading}>
              <span>
                {h.projects[lang]} <span className={s.context}>· {cv.projectsContext[lang]}</span>
              </span>
            </h3>
            <Steps items={projects} look={timeline} />
          </section>

          <section>
            <h3 className={s.heading}>
              <span>{h.other[lang]}</span>
            </h3>
            <ul className={s.rows}>
              {cv.other.map((job) => (
                <li key={job.place}>
                  {job.role[lang]} – {job.place}
                  <span className={s.detail}>
                    {job.period[lang]} · {job.note[lang]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={s.aside}>
          <section>
            <h3 className={s.heading}>
              <span>{h.skills[lang]}</span>
            </h3>
            {cvSkillGroups(skills.categories, lang).map((group) => (
              <div key={group.label} className={s.groupItem}>
                <h4 className={s.group}>{group.label}</h4>
                <p className={s.groupTags}>{group.tags.join(" · ")}</p>
              </div>
            ))}
          </section>

          <section>
            <h3 className={s.heading}>
              <span>{h.certificates[lang]}</span>
            </h3>
            <ul className={s.rows}>
              {cv.certificates.map((c) => (
                <li key={c.name.pl}>
                  {c.name[lang]}
                  <span className={s.detail}>
                    {c.issuer} · {c.year}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className={s.heading}>
              <span>{h.education[lang]}</span>
            </h3>
            {cv.education.map((e) => (
              <p key={e.school.pl} className={s.small}>
                {e.school[lang]}
                <span className={s.detail}>{e.years}</span>
              </p>
            ))}
          </section>

          <section>
            <h3 className={s.heading}>
              <span>{h.languages[lang]}</span>
            </h3>
            <ul className={s.list}>
              {cv.languages.map((l) => (
                <li key={l.pl}>{l[lang]}</li>
              ))}
            </ul>
          </section>

          {cv.extra.length > 0 && (
            <section>
              <h3 className={s.heading}>
                <span>{h.extra[lang]}</span>
              </h3>
              <ul className={s.list}>
                {cv.extra.map((x) => (
                  <li key={x.pl}>{x[lang]}</li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <footer className={s.footer}>
        <p className={s.footerRow}>
          <span>
            {cv.footer.interactive[lang]} <a href={interactive}>{displayUrl(interactive)}</a>
          </span>
          <span>GOVO DIGITAL · {year}</span>
        </p>
        {lang === "pl" && <p className={s.consent}>{cv.footer.consentPl}</p>}
      </footer>
    </article>
  );
}
