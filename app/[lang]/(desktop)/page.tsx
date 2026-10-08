import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/JsonLd";
import { isLocale } from "@/lib/i18n";
import { personJsonLd } from "@/lib/seo";

/** Desktop without an open window (metadata in the [lang] layout). */
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <JsonLd data={personJsonLd(lang)} />;
}
