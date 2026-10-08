import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { about } from "@/content/profile/about";
import { JsonLd } from "@/components/ui/JsonLd";
import { AppWindow } from "@/components/window/AppWindow";
import { CvWindow } from "@/components/window/content/CvWindow";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/cv">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = getDictionary(lang).pages.cv;
  return {
    ...pageMetadata({ lang, route: "cv", title: page.title, description: page.description }),
    // the PDF generator (scripts/build-cv.ts) reads title, author and description
    authors: [{ name: about.name }],
  };
}

/** The desktop with the CV window open (server-rendered, own URL; also the source of the PDFs). */
export default async function Page({ params }: PageProps<"/[lang]/cv">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(lang, [{ name: "CV", path: href(lang, "cv") }])} />
      <AppWindow windowKey="cv" title={dict.files.cv} labels={dict.window}>
        <CvWindow lang={lang} />
      </AppWindow>
    </>
  );
}
