import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { AppWindow } from "@/components/window/AppWindow";
import { OfferWindow } from "@/components/window/content/OfferWindow";
import { isLocale } from "@/lib/i18n";
import { alternates } from "@/lib/routes";

export async function generateMetadata({ params }: PageProps<"/[lang]/oferta">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = getDictionary(lang).pages.offer;
  return {
    title: page.title,
    description: page.description,
    alternates: alternates(lang, "offer"),
    openGraph: { title: page.title, description: page.description },
  };
}

/** The desktop with the offer window open (server-rendered, own URL). */
export default async function Page({ params }: PageProps<"/[lang]/oferta">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <AppWindow windowKey="offer" title={dict.files.offer} labels={dict.window}>
      <OfferWindow lang={lang} />
    </AppWindow>
  );
}
