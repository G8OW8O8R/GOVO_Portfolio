import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { Analytics } from "@/components/analytics/Analytics";
import { analyticsWebsiteId } from "@/lib/analytics";
import { isLocale, locales } from "@/lib/i18n";
import { IMAGE_FADE_SCRIPT } from "@/lib/images";
import { introScript } from "@/lib/intro";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { fontClasses } from "../fonts";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#e1e0e1",
  colorScheme: "light",
};

/** Defaults and the home page; every window page sets its own (lib/seo.ts). */
export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    ...pageMetadata({ lang, route: "home", title: dict.meta.title, description: dict.meta.description }),
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // statistics: Vercel production only (read at build time, the pages are static)
  const websiteId = analyticsWebsiteId(process.env);

  return (
    // data-intro is set by the head script before the first paint (lib/intro.ts)
    <html lang={lang} className={fontClasses} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript() }} />
        <script dangerouslySetInnerHTML={{ __html: IMAGE_FADE_SCRIPT }} />
      </head>
      <body className="font-sans">
        {children}
        {websiteId && <Analytics websiteId={websiteId} labels={getDictionary(lang).analytics} />}
      </body>
    </html>
  );
}
