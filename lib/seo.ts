import type { Metadata } from "next";
import { getDictionary } from "@/content/dictionaries";
import { about } from "@/content/profile/about";
import { SITE_URL } from "@/content/profile/contact";
import { links } from "@/content/profile/links";
import { pricing } from "@/content/profile/pricing";
import type { Pricing } from "@/content/profile/schema";
import type { Project } from "@/content/projects/schema";
import { formatPriceFrom } from "./format";
import { locales, type Locale } from "./i18n";
import { alternates, href, type RouteKey } from "./routes";

/** Share image of every page without its own (scripts/build-og.ts). */
export const SITE_OG = "/og.jpg";
const OG_SIZE = { width: 1200, height: 630 };

const ogLocale = (lang: Locale) => (lang === "pl" ? "pl_PL" : "en_US");
export const absolute = (path: string) => new URL(path, SITE_URL).toString();

/**
 * Full metadata of one page: title, description, canonical + hreflang, and
 * Open Graph / Twitter with a 1200×630 image. A page's `openGraph` replaces
 * the layout's whole object, so every page sets all of it here.
 */
export function pageMetadata({
  lang,
  route,
  slug,
  title,
  description,
  image = SITE_OG,
  imageAlt,
  type = "website",
}: {
  lang: Locale;
  route: RouteKey;
  slug?: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
}): Metadata {
  const dict = getDictionary(lang);
  const alt = alternates(lang, route, slug);
  const images = [{ url: image, ...OG_SIZE, alt: imageAlt ?? dict.meta.ogAlt }];
  return {
    title,
    description,
    alternates: alt,
    openGraph: {
      type,
      siteName: dict.meta.siteName,
      locale: ogLocale(lang),
      alternateLocale: locales.filter((l) => l !== lang).map(ogLocale),
      url: alt.canonical,
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

type JsonLd = Record<string, unknown>;

const PERSON_ID = `${SITE_URL}/#person`;

/** schema.org Person: the author (home page, About me). */
export function personJsonLd(lang: Locale): JsonLd {
  const dict = getDictionary(lang);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: about.name,
    jobTitle: "Frontend developer",
    description: dict.meta.description,
    url: absolute(href(lang, "home")),
    image: absolute("/cv/photo.jpg"),
    worksFor: { "@type": "Organization", name: dict.meta.siteName, url: SITE_URL },
    sameAs: [links.linkedin, links.github].filter(Boolean),
  };
}

/** schema.org CreativeWork: a project's case study. */
export function creativeWorkJsonLd(project: Project, lang: Locale): JsonLd {
  const cs = project.caseStudy;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title[lang],
    headline: `${project.title[lang]} – ${project.summary[lang]}`,
    description: cs.description[lang],
    url: absolute(href(lang, "project", project.slug)),
    image: absolute(project.og),
    inLanguage: lang,
    dateCreated: String(project.year),
    creator: { "@id": PERSON_ID, "@type": "Person", name: about.name },
    keywords: cs.stack.join(", "),
    sameAs: [cs.live.url, cs.code?.url].filter(Boolean),
  };
}

/** schema.org BreadcrumbList from the home page to `trail` (name + path, last = this page). */
export function breadcrumbJsonLd(lang: Locale, trail: { name: string; path: string }[]): JsonLd {
  const items = [{ name: getDictionary(lang).meta.siteName, path: href(lang, "home") }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

type Package = Pricing["packages"][number];

/** Packages of pricing.ts by id, in the given order (unknown ids fail loudly). */
export function packagesById(ids: readonly string[], source: Pricing = pricing): Package[] {
  return ids.map((id) => {
    const pkg = source.packages.find((p) => p.id === id);
    if (!pkg) throw new Error(`Unknown package "${id}"`);
    return pkg;
  });
}

/**
 * Fills `{price}` (the lowest "from" price of the packages: "od 990 zł") and
 * `{time}` (the first package's time) in a title or description, so no page
 * carries a price of its own.
 */
export function withPrice(text: string, packages: readonly Package[], lang: Locale): string {
  const lowest = Math.min(...packages.map((p) => p.from));
  return text.replaceAll("{price}", formatPriceFrom(lowest, lang)).replaceAll("{time}", packages[0].time[lang]);
}

/** Page title with the lowest price: "Landing page – od 1 490 zł | GOVO DIGITAL". */
export function titleWithPrice(title: string, packages: readonly Package[], lang: Locale): string {
  return `${title} ${withPrice("– {price}", packages, lang)} | ${getDictionary(lang).meta.siteName}`;
}

/** Net "from" price in PLN; per month for care. */
function priceSpecification(from: number, perMonth = false): JsonLd {
  return {
    "@type": perMonth ? "UnitPriceSpecification" : "PriceSpecification",
    minPrice: from,
    priceCurrency: "PLN",
    valueAddedTaxIncluded: false,
    ...(perMonth ? { unitCode: "MON" } : {}),
  };
}

const provider = (lang: Locale): JsonLd => ({
  "@type": "Person",
  "@id": PERSON_ID,
  name: about.name,
  url: absolute(href(lang, "home")),
});

/**
 * schema.org Service with one Offer per package (service and local pages).
 * `areaServed`: only the city on a local page; otherwise Poland on Polish
 * pages and none in English (clients worldwide).
 */
export function serviceJsonLd({
  lang,
  name,
  description,
  path,
  packages,
  city,
}: {
  lang: Locale;
  name: string;
  description: string;
  path: string;
  packages: readonly Package[];
  city?: string;
}): JsonLd {
  const url = absolute(path);
  const areaServed: JsonLd | undefined = city
    ? { "@type": "City", name: city }
    : lang === "pl"
      ? { "@type": "Country", name: getDictionary(lang).seo.country }
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType: name,
    description,
    url,
    provider: provider(lang),
    ...(areaServed ? { areaServed } : {}),
    offers: packages.map((p) => ({
      "@type": "Offer",
      name: p.name[lang],
      description: p.description[lang],
      url,
      priceCurrency: "PLN",
      priceSpecification: priceSpecification(p.from),
    })),
  };
}

/** schema.org FAQPage: only for questions shown on the page, in the same words. */
export function faqJsonLd(items: readonly { q: string; a: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/** schema.org OfferCatalog of every package and the care plan (pricing page); `pageFor` = a package's service page. */
export function pricingJsonLd(lang: Locale, path: string, pageFor: (packageId: string) => string | undefined): JsonLd {
  const dict = getDictionary(lang);
  const url = absolute(path);
  const offer = (name: string, description: string, spec: JsonLd, page?: string): JsonLd => ({
    "@type": "Offer",
    url: page ? absolute(page) : url,
    priceCurrency: "PLN",
    priceSpecification: spec,
    itemOffered: { "@type": "Service", name, description, provider: provider(lang), ...(page ? { url: absolute(page) } : {}) },
  });
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: dict.pages.pricing.title,
    url,
    itemListElement: [
      ...pricing.packages.map((p) => offer(p.name[lang], p.description[lang], priceSpecification(p.from), pageFor(p.id))),
      offer(pricing.care.name[lang], pricing.care.description[lang], priceSpecification(pricing.care.fromMonthly, true)),
    ],
  };
}

/** JSON for a `<script type="application/ld+json">`: `<` escaped, so no text can close the script. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
