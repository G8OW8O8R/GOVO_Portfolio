import type { Metadata } from "next";
import { getDictionary } from "@/content/dictionaries";
import { about } from "@/content/profile/about";
import { SITE_URL } from "@/content/profile/contact";
import { links } from "@/content/profile/links";
import type { Project } from "@/content/projects/schema";
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

/** JSON for a `<script type="application/ld+json">`: `<` escaped, so no text can close the script. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
