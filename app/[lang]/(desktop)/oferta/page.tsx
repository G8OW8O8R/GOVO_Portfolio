import type { Metadata } from "next";
import { getDictionary } from "@/content/dictionaries";
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

/** The Offer window arrives in task 3; the URL already renders the desktop. */
export default function OfferPage() {
  return null;
}
