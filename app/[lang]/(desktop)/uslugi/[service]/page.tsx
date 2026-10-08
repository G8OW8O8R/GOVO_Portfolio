import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { getServicePage } from "@/content/seo/services";
import { JsonLd } from "@/components/ui/JsonLd";
import { AppWindow } from "@/components/window/AppWindow";
import { ServiceWindow } from "@/components/window/content/OfferPageWindow";
import { isLocale } from "@/lib/i18n";
import { href, pageIdForSlug, serviceIds, serviceSlugs } from "@/lib/routes";
import { breadcrumbJsonLd, packagesById, pageMetadata, serviceJsonLd, titleWithPrice, withPrice } from "@/lib/seo";

export const dynamicParams = false;

/** Each language has its own slugs (/pl/uslugi/landing-page, /en/services/landing-pages). */
export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const { lang } = params;
  if (!isLocale(lang)) return [];
  return serviceIds.map((id) => ({ service: serviceSlugs[id][lang] }));
}

async function load(params: PageProps<"/[lang]/uslugi/[service]">["params"]) {
  const { lang, service } = await params;
  if (!isLocale(lang)) return null;
  const id = pageIdForSlug("service", lang, service);
  const page = id ? getServicePage(id) : undefined;
  return page ? { lang, page, packages: packagesById(page.packages) } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/uslugi/[service]">): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  const { lang, page, packages } = data;
  return pageMetadata({
    lang,
    route: "service",
    slug: page.id,
    title: titleWithPrice(page.title[lang], packages, lang),
    description: withPrice(page.description[lang], packages, lang),
  });
}

/** The desktop with a service page open as a window. */
export default async function ServicePage({ params }: PageProps<"/[lang]/uslugi/[service]">) {
  const data = await load(params);
  if (!data) notFound();
  const { lang, page, packages } = data;
  const dict = getDictionary(lang);
  const path = href(lang, "service", page.id);
  return (
    <>
      <JsonLd
        data={[
          serviceJsonLd({ lang, name: page.name[lang], description: withPrice(page.description[lang], packages, lang), path, packages }),
          breadcrumbJsonLd(lang, [
            { name: dict.files.offer, path: href(lang, "offer") },
            { name: page.name[lang], path },
          ]),
        ]}
      />
      <AppWindow windowKey={`service-${page.id}`} title={page.name[lang]} labels={dict.window}>
        <ServiceWindow page={page} lang={lang} />
      </AppWindow>
    </>
  );
}
