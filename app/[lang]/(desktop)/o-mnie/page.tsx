import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { JsonLd } from "@/components/ui/JsonLd";
import { AppWindow } from "@/components/window/AppWindow";
import { AboutWindow } from "@/components/window/content/AboutWindow";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { breadcrumbJsonLd, pageMetadata, personJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/o-mnie">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = getDictionary(lang).pages.about;
  return pageMetadata({ lang, route: "about", title: page.title, description: page.description });
}

/** The desktop with the about window open (server-rendered, own URL). */
export default async function Page({ params }: PageProps<"/[lang]/o-mnie">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <>
      <JsonLd data={[personJsonLd(lang), breadcrumbJsonLd(lang, [{ name: dict.files.about, path: href(lang, "about") }])]} />
      <AppWindow windowKey="about" title={dict.files.about} labels={dict.window}>
        <AboutWindow lang={lang} />
      </AppWindow>
    </>
  );
}
