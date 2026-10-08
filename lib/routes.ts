import { defaultLocale, isLocale, locales, type Locale } from "./i18n";

/**
 * Public URL segments per locale. Folders in `app/[lang]` use the Polish
 * segment; English URLs are rewritten to them in next.config.ts.
 * `local` has no segment: a local page's slug is the whole path segment.
 */
export const routeSegments = {
  home: { pl: "", en: "" },
  about: { pl: "o-mnie", en: "about" },
  offer: { pl: "oferta", en: "services" },
  contact: { pl: "kontakt", en: "contact" },
  project: { pl: "projekty", en: "projects" },
  cv: { pl: "cv", en: "cv" },
  service: { pl: "uslugi", en: "services" },
  pricing: { pl: "cennik", en: "pricing" },
  local: { pl: "", en: "" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routeSegments;

/**
 * Service pages: id → slug per language. The service slugs are the
 * addresses of the previous site, kept so the pages stay where they were.
 */
export const serviceSlugs = {
  "strony-internetowe": { pl: "strony-internetowe", en: "website-development" },
  "landing-page": { pl: "landing-page", en: "landing-pages" },
  "sklep-internetowy": { pl: "sklep-internetowy", en: "ecommerce-development" },
  redesign: { pl: "redesign-strony", en: "website-redesign" },
  "projekt-specjalny": { pl: "projekt-specjalny", en: "special-project" },
} as const satisfies Record<string, Record<Locale, string>>;

/** Local pages: id → slug per language (`/pl/strony-internetowe-warszawa`). */
export const localSlugs = {
  warszawa: { pl: "strony-internetowe-warszawa", en: "web-design-warsaw" },
} as const satisfies Record<string, Record<Locale, string>>;

export type ServiceId = keyof typeof serviceSlugs;
export type LocalId = keyof typeof localSlugs;
export const serviceIds = Object.keys(serviceSlugs) as ServiceId[];
export const localIds = Object.keys(localSlugs) as LocalId[];

type Slugs = Record<string, Record<Locale, string>>;
const slugTables: Partial<Record<RouteKey, Slugs>> = { service: serviceSlugs, local: localSlugs };

/** Id of the page whose slug is `slug` (service or local; in `lang`, or in any language), or null. */
export function pageIdForSlug(route: "service" | "local", lang: Locale | null, slug: string): string | null {
  const table = slugTables[route]!;
  const langs = lang ? [lang] : locales;
  return Object.keys(table).find((id) => langs.some((l) => table[id][l] === slug)) ?? null;
}

/** Path of a page; `slug` is the project slug or the id of a service / local page. */
export function href(lang: Locale, route: RouteKey, slug?: string): string {
  if ((route === "project" || route === "service" || route === "local") && !slug) {
    throw new Error(`Route "${route}" needs a slug`);
  }
  const table = slugTables[route];
  const tail = table && slug ? table[slug]?.[lang] : slug;
  if (table && !tail) throw new Error(`Unknown ${route} "${slug}"`);
  const parts = [lang, routeSegments[route][lang], tail].filter(Boolean);
  return `/${parts.join("/")}`;
}

/**
 * Route and slug (project slug, service / local id) of a pathname, or null.
 * Segments and slugs match in either language: on the server a rewritten
 * English URL arrives with the Polish folder name (/en/o-mnie).
 */
function parsePath(pathname: string): { lang: Locale; route: RouteKey; slug?: string } | null {
  const [, maybeLang = "", segment = "", slug = ""] = pathname.split("/");
  if (!isLocale(maybeLang)) return null;
  const lang = maybeLang;
  if (!segment) return { lang, route: "home" };

  const local = pageIdForSlug("local", null, segment);
  if (local) return slug ? null : { lang, route: "local", slug: local };

  // "services" is both the offer and the service pages in English: a slug decides
  const routes = (Object.keys(routeSegments) as RouteKey[]).filter(
    (key) => key !== "home" && key !== "local" && locales.some((l) => routeSegments[key][l] === segment),
  );
  for (const route of routes) {
    if (route === "project") return slug ? { lang, route, slug } : null;
    if (route === "service") {
      const id = slug ? pageIdForSlug("service", null, slug) : null;
      if (id) return { lang, route, slug: id };
      continue;
    }
    if (!slug) return { lang, route };
  }
  return null;
}

/** Same page in the other language; falls back to that language's home. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const page = parsePath(pathname);
  if (!page) return href(target, "home");
  return href(target, page.route, page.slug);
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
    const tail = key === "project" || key === "service" ? "/:slug" : "";
    rules.push({ english: `/en/${en}${tail}`, internal: `/en/${pl}${tail}` });
  }
  return rules;
}

/** Desktop windows: every window has its own URL. */
export type WindowKey =
  | "about"
  | "offer"
  | "contact"
  | "cv"
  | "pricing"
  | `project-${string}`
  | `service-${string}`
  | `local-${string}`;

/** Window shown at a pathname, or null for the bare desktop / unknown paths. */
export function windowKeyForPath(pathname: string): WindowKey | null {
  const page = parsePath(pathname);
  switch (page?.route) {
    case "about":
    case "offer":
    case "contact":
    case "cv":
    case "pricing":
      return page.route;
    case "project":
    case "service":
    case "local":
      return `${page.route}-${page.slug}`;
    default:
      return null;
  }
}

/** Windows that are pages of the offer (they have no file of their own). */
export function isOfferPage(key: WindowKey): boolean {
  return key === "pricing" || key.startsWith("service-") || key.startsWith("local-");
}

/** The desktop file a window grows from and minimises to: the offer pages belong to Oferta. */
export function fileKeyForWindow(key: WindowKey): WindowKey {
  return isOfferPage(key) ? "offer" : key;
}

export function windowHref(lang: Locale, key: WindowKey): string {
  for (const route of ["project", "service", "local"] as const) {
    if (key.startsWith(`${route}-`)) return href(lang, route, key.slice(route.length + 1));
  }
  return href(lang, key as Exclude<RouteKey, "home" | "project" | "service" | "local">);
}

/**
 * How a window navigation touches history. Opening from the bare desktop
 * pushes (so "back" closes the window); switching between windows replaces
 * (one window at a time, back still returns to the desktop). Closing goes
 * back when the previous entry is the desktop, otherwise replaces with it
 * (window opened from a shared link or after a reload).
 */
export function openMode(windowOpen: boolean): "push" | "replace" {
  return windowOpen ? "replace" : "push";
}

export function closeMode(previousIsDesktop: boolean): "back" | "replace" {
  return previousIsDesktop ? "back" : "replace";
}
