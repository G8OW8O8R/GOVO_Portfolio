import Image from "next/image";
import { getDictionary } from "@/content/dictionaries";
import type { Project } from "@/content/projects/schema";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { WindowLink } from "../WindowLink";
import { ui } from "./ui";

/**
 * Case study window – skeleton (task 3): header, cover and the places for
 * the sections of the case study spec. Full content arrives in task 4.
 */
export function ProjectWindow({ project, lang }: { project: Project; lang: Locale }) {
  const dict = getDictionary(lang);
  return (
    <article className={`${ui.page} max-w-[820px]`}>
      <header className="text-center">
        <h2 className="text-[44px] font-bold leading-none tracking-[-0.035em] text-ink desk:text-[60px]">{project.title[lang]}</h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-[17px] leading-snug text-ink-soft desk:text-[19px]">{project.summary[lang]}</p>
      </header>

      <figure className="relative mt-8">
        <span
          aria-hidden="true"
          className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(closest-side,rgb(236_168_72/0.45),transparent)] blur-2xl"
        />
        <Image
          src={`/projects/${project.slug}/cover.jpg`}
          alt={`${project.title[lang]} – ${dict.project.cover}`}
          width={2576}
          height={1438}
          sizes="(max-width: 767px) 92vw, 760px"
          className="relative h-auto w-full rounded-[16px] object-cover shadow-[0_18px_50px_rgb(0_0_0/0.18)]"
          loading="eager"
        />
      </figure>

      <div className="mt-12 space-y-10" aria-busy="true" aria-label={dict.project.pending}>
        {dict.project.sections.map((section) => (
          <section key={section}>
            <h3 className={ui.eyebrow}>{section}</h3>
            <div className="mt-3 space-y-2" aria-hidden="true">
              <span className="block h-3 w-full rounded-full bg-win-card" />
              <span className="block h-3 w-[92%] rounded-full bg-win-card" />
              <span className="block h-3 w-[64%] rounded-full bg-win-card" />
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-12 flex justify-center border-t border-win-line pt-8">
        <WindowLink href={href(lang, "contact")} className={ui.primary}>
          {dict.workWithMe.label}
        </WindowLink>
      </footer>
    </article>
  );
}
