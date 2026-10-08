import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { getProject, projects } from "@/content/projects";
import { JsonLd } from "@/components/ui/JsonLd";
import { AppWindow } from "@/components/window/AppWindow";
import { ProjectWindow } from "@/components/window/content/ProjectWindow";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { breadcrumbJsonLd, creativeWorkJsonLd, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/projekty/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = getProject(slug);
  if (!isLocale(lang) || !project) return {};
  return pageMetadata({
    lang,
    route: "project",
    slug,
    title: `${project.title[lang]} – ${project.summary[lang].replace(/\.$/, "")} | ${getDictionary(lang).meta.siteName}`,
    description: project.caseStudy.description[lang],
    image: project.og,
    imageAlt: `${project.title[lang]} – ${project.summary[lang]}`,
    type: "article",
  });
}

/** The desktop with the project window open (case study). */
export default async function ProjectPage({ params }: PageProps<"/[lang]/projekty/[slug]">) {
  const { lang, slug } = await params;
  const project = getProject(slug);
  if (!isLocale(lang) || !project) notFound();
  return (
    <>
      <JsonLd
        data={[
          creativeWorkJsonLd(project, lang),
          breadcrumbJsonLd(lang, [{ name: project.title[lang], path: href(lang, "project", slug) }]),
        ]}
      />
      <AppWindow windowKey={`project-${project.slug}`} title={project.title[lang]} labels={getDictionary(lang).window}>
        <ProjectWindow project={project} lang={lang} />
      </AppWindow>
    </>
  );
}
