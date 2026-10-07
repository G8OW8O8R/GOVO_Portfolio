import { notFound } from "next/navigation";
import { Desktop } from "@/components/desktop/Desktop";
import { isLocale } from "@/lib/i18n";

/** The desktop stays mounted; each route renders its window as children. */
export default async function DesktopLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <Desktop lang={lang}>{children}</Desktop>;
}
