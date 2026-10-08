import { getDictionary } from "@/content/dictionaries";
import type { Project } from "@/content/projects/schema";
import type { Locale } from "@/lib/i18n";
import { PreviewVideo } from "../motion/PreviewVideo";
import { ui } from "./ui";

/**
 * Case study window – for now title, summary and the cover, which turns
 * into the preview loop once in view (play/pause on click). The full showreel and the sections of
 * the case study spec (and the footer navigation) arrive with their content in
 * task 4; until then they stay hidden (no placeholders on production).
 */
export function ProjectWindow({ project, lang }: { project: Project; lang: Locale }) {
  const dict = getDictionary(lang);
  return (
    <article className={`${ui.page} max-w-[860px]`}>
      <header className="text-center">
        <h2 className="text-balance text-40 font-semibold tracking-[-0.035em] text-ink desk:text-56">{project.title[lang]}</h2>
        <p className={`mx-auto mt-4 max-w-[40ch] ${ui.body} desk:text-22`}>{project.summary[lang]}</p>
      </header>

      <PreviewVideo
        slug={project.slug}
        sizes="(max-width: 767px) 92vw, 780px"
        labels={dict.video}
        className="relative mt-10 block aspect-[1280/634] w-full overflow-hidden rounded-[14px] bg-win-fill shadow-[0_24px_60px_-12px_rgb(0_0_0/0.35)]"
      />
    </article>
  );
}
