import { getDictionary } from "@/content/dictionaries";
import { offer } from "@/content/profile/offer";
import { serviceIds } from "@/lib/routes";
import { LoadAhead } from "@/components/desktop/LoadAhead";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { imageSet } from "@/lib/image-manifest";
import { RevealHeading } from "../motion/RevealHeading";
import { Tabs } from "../Tabs";
import { WindowLink } from "../WindowLink";
import { PricingContent } from "./PricingContent";
import { Steps, Thumb, ui } from "./ui";

export function OfferWindow({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const t = dict.tabs.offer;
  return (
    <>
      <Tabs label={dict.files.offer} tabs={[t.services, t.process, t.pricing]}>
        <ServicesPanel lang={lang} />
        <ProcessPanel lang={lang} />
        <PricingContent lang={lang} />
      </Tabs>
      <ServicesAhead lang={lang} />
    </>
  );
}

/**
 * The service pages load ahead only once the Offer or Pricing is open (their
 * links are here), not on every visit: same rules as the desktop's windows.
 */
export function ServicesAhead({ lang }: { lang: Locale }) {
  return <LoadAhead windows={serviceIds.map((id) => href(lang, "service", id))} images={[]} />;
}

/**
 * What I do – four large surfaces, each with its own picture; no prices here
 * (they live only in Pricing). Each title links to its service page.
 */
function ServicesPanel({ lang }: { lang: Locale }) {
  return (
    <div className={ui.page}>
      <RevealHeading text={offer.servicesTitle[lang]} className={ui.title} />
      <p className={ui.introText}>{offer.servicesLead[lang]}</p>

      <div data-stagger="" className="mt-8 grid gap-4 desk:grid-cols-2">
        {offer.services.map((service) => (
          <section
            key={service.id}
            className={`${ui.surface} flex flex-col p-5 desk:p-6`}
            aria-labelledby={`service-${service.id}`}
          >
            <Thumb
              image={imageSet(`/services/${service.thumb}.png`)}
              eager
              className="aspect-square w-20 desk:w-24"
              tilt
            />
            <h3 id={`service-${service.id}`} className="mt-5 text-22 font-semibold tracking-[-0.02em] text-ink">
              <WindowLink
                href={href(lang, "service", service.page)}
                className="underline decoration-transparent decoration-1 underline-offset-[5px] transition-colors hover:decoration-ink/40"
              >
                {service.title[lang]}
              </WindowLink>
            </h3>
            <p className="mt-2 flex-1 text-15 text-ink-soft">{service.text[lang]}</p>
            <p className="mt-5 border-t border-win-line pt-4 text-15 text-ink">{service.fit[lang]}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function ProcessPanel({ lang }: { lang: Locale }) {
  return (
    <div className={ui.page}>
      <RevealHeading text={offer.processTitle[lang]} className={ui.title} />
      <Steps
        className="mx-auto mt-10 max-w-[640px]"
        items={offer.process.map((step) => ({ title: step.title[lang], text: step.text[lang] }))}
      />
    </div>
  );
}
