import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { JsonLd } from "@/components/ui/JsonLd";
import { AppWindow } from "@/components/window/AppWindow";
import { PrivacyWindow } from "@/components/window/content/PrivacyWindow";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/prywatnosc">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = getDictionary(lang).pages.privacy;
  return pageMetadata({ lang, route: "privacy", title: page.title, description: page.description });
}

/** The desktop with the privacy window open (server-rendered, own URL). */
export default async function Page({ params }: PageProps<"/[lang]/prywatnosc">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(lang, [{ name: dict.files.privacy, path: href(lang, "privacy") }])} />
      <AppWindow windowKey="privacy" title={dict.files.privacy} labels={dict.window}>
        <PrivacyWindow lang={lang} />
      </AppWindow>
    </>
  );
}
