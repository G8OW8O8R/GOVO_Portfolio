import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { getProject, projects } from "@/content/projects";
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

/** The case study window arrives in tasks 3–4; the URL already renders the desktop. */
export default async function ProjectPage({ params }: PageProps<"/[lang]/projekty/[slug]">) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();
  return null;
}
