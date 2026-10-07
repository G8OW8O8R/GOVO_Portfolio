import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { AppWindow } from "@/components/window/AppWindow";
import { ContactWindow } from "@/components/window/content/ContactWindow";
import { isLocale } from "@/lib/i18n";
import { alternates } from "@/lib/routes";

export async function generateMetadata({ params }: PageProps<"/[lang]/kontakt">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = getDictionary(lang).pages.contact;
  return {
    title: page.title,
    description: page.description,
    alternates: alternates(lang, "contact"),
    openGraph: { title: page.title, description: page.description },
  };
}

/** The desktop with the contact window open (server-rendered, own URL). */
export default async function Page({ params }: PageProps<"/[lang]/kontakt">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <AppWindow windowKey="contact" title={dict.files.contact} labels={dict.window}>
      <ContactWindow lang={lang} />
    </AppWindow>
  );
}
