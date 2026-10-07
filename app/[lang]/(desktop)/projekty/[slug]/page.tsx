import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { getProject, projects } from "@/content/projects";
import { AppWindow } from "@/components/window/AppWindow";
import { ProjectWindow } from "@/components/window/content/ProjectWindow";
import { isLocale } from "@/lib/i18n";
import { alternates } from "@/lib/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/projekty/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = getProject(slug);
  if (!isLocale(lang) || !project) return {};
  const title = `${project.title[lang]} – ${getDictionary(lang).pages.project.titleSuffix}`;
  return {
    title,
    description: project.summary[lang],
    alternates: alternates(lang, "project", slug),
    openGraph: { title, description: project.summary[lang], images: `/projects/${slug}/og.jpg` },
  };
}

/** The desktop with the project window open (case study skeleton; full content in task 4). */
export default async function ProjectPage({ params }: PageProps<"/[lang]/projekty/[slug]">) {
  const { lang, slug } = await params;
  const project = getProject(slug);
  if (!isLocale(lang) || !project) notFound();
  return (
    <AppWindow windowKey={`project-${project.slug}`} title={project.title[lang]} labels={getDictionary(lang).window}>
      <ProjectWindow project={project} lang={lang} />
    </AppWindow>
  );
}
