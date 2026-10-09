import type { Metadata, Viewport } from "next";
import { getDictionary } from "@/content/dictionaries";
import { NotFoundView } from "@/components/not-found/NotFoundView";
import { defaultLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import { fontClasses } from "./fonts";
import "./globals.css";

// Addresses that match no route at all (/xyz, /pl/a/b): a whole document of its own,
// outside the language layout. Polish first, English under it.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: getDictionary(defaultLocale).notFound.meta,
  robots: { index: false },
};

export const viewport: Viewport = {
  themeColor: "#e1e0e1",
  colorScheme: "light",
};

export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale} className={fontClasses}>
      <body className="font-sans">
        <NotFoundView lang={defaultLocale} />
      </body>
    </html>
  );
}
