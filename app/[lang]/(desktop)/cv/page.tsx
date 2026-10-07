import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { AppWindow } from "@/components/window/AppWindow";
import { CvWindow } from "@/components/window/content/CvWindow";
import { isLocale } from "@/lib/i18n";
import { alternates } from "@/lib/routes";
import { hasCv } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/cv">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang) || !hasCv()) return {};
  const page = getDictionary(lang).pages.cv;
  return {
    title: page.title,
    description: page.description,
    alternates: alternates(lang, "cv"),
    openGraph: { title: page.title, description: page.description },
  };
}

/** The desktop with the cv window open (server-rendered, own URL). */
export default async function Page({ params }: PageProps<"/[lang]/cv">) {
  const { lang } = await params;
  if (!isLocale(lang) || !hasCv()) notFound();
  const dict = getDictionary(lang);
  return (
    <AppWindow windowKey="cv" title={dict.files.cv} labels={dict.window}>
      <CvWindow lang={lang} />
    </AppWindow>
  );
}
