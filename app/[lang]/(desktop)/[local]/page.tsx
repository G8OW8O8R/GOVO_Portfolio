import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { getLocalPage } from "@/content/seo/local";
import { JsonLd } from "@/components/ui/JsonLd";
import { AppWindow } from "@/components/window/AppWindow";
import { LocalWindow } from "@/components/window/content/OfferPageWindow";
import { isLocale } from "@/lib/i18n";
import { href, localIds, localSlugs, pageIdForSlug } from "@/lib/routes";
import { breadcrumbJsonLd, packagesById, pageMetadata, serviceJsonLd, titleWithPrice, withPrice } from "@/lib/seo";

export const dynamicParams = false;

/** Local pages sit right under the language: /pl/strony-internetowe-warszawa, /en/web-design-warsaw. */
export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const { lang } = params;
  if (!isLocale(lang)) return [];
  return localIds.map((id) => ({ local: localSlugs[id][lang] }));
}

async function load(params: PageProps<"/[lang]/[local]">["params"]) {
  const { lang, local } = await params;
  if (!isLocale(lang)) return null;
  const id = pageIdForSlug("local", lang, local);
  const page = id ? getLocalPage(id) : undefined;
  return page ? { lang, page, packages: packagesById(page.packages.map((p) => p.id)) } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[local]">): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  const { lang, page, packages } = data;
  return pageMetadata({
    lang,
    route: "local",
    slug: page.id,
    title: titleWithPrice(page.title[lang], packages, lang),
    description: withPrice(page.description[lang], packages, lang),
  });
}

/** The desktop with a local page open as a window. */
export default async function LocalPage({ params }: PageProps<"/[lang]/[local]">) {
  const data = await load(params);
  if (!data) notFound();
  const { lang, page, packages } = data;
  const dict = getDictionary(lang);
  const path = href(lang, "local", page.id);
  return (
    <>
      <JsonLd
        data={[
          serviceJsonLd({
            lang,
            name: page.h1[lang],
            description: withPrice(page.description[lang], packages, lang),
            path,
            packages,
            city: page.city[lang],
          }),
          breadcrumbJsonLd(lang, [
            { name: dict.files.offer, path: href(lang, "offer") },
            { name: page.title[lang], path },
          ]),
        ]}
      />
      <AppWindow windowKey={`local-${page.id}`} title={page.name[lang]} labels={dict.window}>
        <LocalWindow page={page} lang={lang} />
      </AppWindow>
    </>
  );
}
