import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/content/dictionaries";
import { pricing } from "@/content/profile/pricing";
import { serviceForPackage } from "@/content/seo/services";
import { JsonLd } from "@/components/ui/JsonLd";
import { AppWindow } from "@/components/window/AppWindow";
import { PlayOnOpen } from "@/components/window/motion/PlayOnOpen";
import { PricingContent } from "@/components/window/content/PricingContent";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { breadcrumbJsonLd, pageMetadata, pricingJsonLd, titleWithPrice, withPrice } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/cennik">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const page = getDictionary(lang).pages.pricing;
  return pageMetadata({
    lang,
    route: "pricing",
    title: titleWithPrice(page.title, pricing.packages, lang),
    description: withPrice(page.description, pricing.packages, lang),
  });
}

/** The desktop with the pricing page open: the same content as the Pricing tab of the Offer. */
export default async function PricingPage({ params }: PageProps<"/[lang]/cennik">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const path = href(lang, "pricing");
  const pageFor = (id: string) => {
    const service = serviceForPackage(id);
    return service && href(lang, "service", service.id);
  };
  return (
    <>
      <JsonLd
        data={[
          pricingJsonLd(lang, path, pageFor),
          breadcrumbJsonLd(lang, [
            { name: dict.files.offer, path: href(lang, "offer") },
            { name: dict.files.pricing, path },
          ]),
        ]}
      />
      <AppWindow windowKey="pricing" title={dict.files.pricing} labels={dict.window}>
        <PlayOnOpen>
          <PricingContent lang={lang} heading={dict.pages.pricing.title} />
        </PlayOnOpen>
      </AppWindow>
    </>
  );
}
