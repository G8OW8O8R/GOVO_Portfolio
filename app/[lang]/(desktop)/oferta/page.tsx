import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { JsonLd } from "@/components/ui/JsonLd";
import { AppWindow } from "@/components/window/AppWindow";
import { OfferWindow } from "@/components/window/content/OfferWindow";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/oferta">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = getDictionary(lang).pages.offer;
  return pageMetadata({ lang, route: "offer", title: page.title, description: page.description });
}

/** The desktop with the offer window open (server-rendered, own URL). */
export default async function Page({ params }: PageProps<"/[lang]/oferta">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(lang, [{ name: dict.files.offer, path: href(lang, "offer") }])} />
      <AppWindow windowKey="offer" title={dict.files.offer} labels={dict.window}>
        <OfferWindow lang={lang} />
      </AppWindow>
    </>
  );
}
