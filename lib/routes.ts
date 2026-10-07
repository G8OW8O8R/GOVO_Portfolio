import { defaultLocale, isLocale, locales, type Locale } from "./i18n";

/**
 * Public URL segments per locale. Folders in `app/[lang]` use the Polish
 * segment; English URLs are rewritten to them in next.config.ts.
 */
export const routeSegments = {
  home: { pl: "", en: "" },
  about: { pl: "o-mnie", en: "about" },
  offer: { pl: "oferta", en: "services" },
  contact: { pl: "kontakt", en: "contact" },
  project: { pl: "projekty", en: "projects" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routeSegments;

export function href(lang: Locale, route: RouteKey, slug?: string): string {
  if (route === "project" && !slug) throw new Error("Project route needs a slug");
  const parts = [lang, routeSegments[route][lang], slug].filter(Boolean);
  return `/${parts.join("/")}`;
}

/** Same page in the other language; falls back to that language's home. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const [, maybeLang = "", segment = "", ...rest] = pathname.split("/");
  if (!isLocale(maybeLang)) return href(target, "home");
  if (!segment) return href(target, "home");

  const route = (Object.keys(routeSegments) as RouteKey[]).find(
    (key) => key !== "home" && routeSegments[key][maybeLang] === segment,
  );
  if (!route) return href(target, "home");
  if (route === "project") {
    return rest[0] ? href(target, "project", rest[0]) : href(target, "home");
  }
  return href(target, route);
}

/** `alternates` for page metadata: canonical + hreflang for every locale. */
export function alternates(lang: Locale, route: RouteKey, slug?: string) {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[locale] = href(locale, route, slug);
  languages["x-default"] = href(defaultLocale, route, slug);
  return { canonical: href(lang, route, slug), languages };
}

/** Rewrites/redirects that serve localized English segments from the Polish folders. */
export function localizedSegmentRules() {
  const rules: { english: string; internal: string }[] = [];
  for (const key of Object.keys(routeSegments) as RouteKey[]) {
    const { pl, en } = routeSegments[key];
    if (pl === en) continue;
    const tail = key === "project" ? "/:slug" : "";
    rules.push({ english: `/en/${en}${tail}`, internal: `/en/${pl}${tail}` });
  }
  return rules;
}
