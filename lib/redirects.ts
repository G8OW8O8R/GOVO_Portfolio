/**
 * Redirects from the previous site on this domain, wired in
 * next.config.ts. Addresses that exist in both sites (/pl, /en, /pl/o-mnie,
 * /en/about, /pl/kontakt, /en/contact, /en/services) need nothing.
 *
 * 301: gone for good – the concept projects, the blog, the skills page
 * (now a tab of About me) and the old unprefixed routes.
 * 307 (temporary, `replacedIn: "4b"`): service, process, pricing and city
 * pages that task 4b replaces with real SEO pages – DO ZAMIANY W 4B: then
 * drop the rule (or point it at the new page with 301).
 *
 * First matching rule wins (as in Next), so specific rules come first.
 * Patterns: `:name` = one segment, `:name*` = zero or more, `:name+` = one or more.
 */
export type Redirect = {
  source: string;
  destination: string;
  status: 301 | 307;
  replacedIn?: "4b";
};

const gone = (source: string, destination: string): Redirect => ({ source, destination, status: 301 });
const until4b = (source: string, destination: string): Redirect => ({ source, destination, status: 307, replacedIn: "4b" });

export const legacyRedirects: Redirect[] = [
  // concept projects (one list page, no detail pages) → the desktop with Obok
  gone("/pl/projekty", "/pl"),
  gone("/en/projects", "/en"),
  gone("/projects", "/pl"),
  // blog: articles, categories and the list → Offer
  gone("/pl/blog/:path*", "/pl/oferta"),
  gone("/en/blog/:path*", "/en/services"),
  // skills → the Skills tab of About me
  gone("/pl/umiejetnosci", "/pl/o-mnie#umiejetnosci"),
  gone("/en/skills", "/en/about#skills"),
  gone("/skills", "/pl/o-mnie#umiejetnosci"),
  // old unprefixed routes and private pages (never indexed)
  gone("/contact", "/pl/kontakt"),
  gone("/me", "/pl"),
  gone("/auth", "/pl"),
  gone("/stats", "/pl"),
  // DO ZAMIANY W 4B: services, pricing, process and city pages
  until4b("/pl/uslugi/cennik", "/pl/oferta#cennik"),
  until4b("/pl/uslugi/:path*", "/pl/oferta"),
  until4b("/en/services/pricing", "/en/services#pricing"),
  until4b("/en/services/:path+", "/en/services"),
  until4b("/pl/proces", "/pl/oferta#proces"),
  until4b("/en/process", "/en/services#process"),
  until4b("/process", "/pl/oferta#proces"),
  until4b("/pl/strony-internetowe-:city", "/pl/oferta"),
];

/** For next.config.ts: 301 as such (Next's `permanent` would give 308), 307 as `permanent: false`. */
export function nextRedirects(rules: Redirect[] = legacyRedirects) {
  return rules.map(({ source, destination, status }) =>
    status === 301 ? { source, destination, statusCode: 301 as const } : { source, destination, permanent: false as const },
  );
}

function patternToRegExp(source: string): RegExp {
  const body = source
    .split("/")
    .slice(1)
    .map((segment) => {
      const param = /^(.*?):\w+([*+]?)$/.exec(segment);
      if (!param) return `/${segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
      const [, prefix, modifier] = param;
      if (modifier === "*") return "(?:/.*)?";
      if (modifier === "+") return "/.+";
      return `/${prefix}[^/]+`;
    })
    .join("");
  return new RegExp(`^${body}$`);
}

/** The rule a path hits (first match), or null. Mirrors Next's matching for the patterns used here. */
export function matchRedirect(path: string, rules: Redirect[] = legacyRedirects): Redirect | null {
  return rules.find((rule) => patternToRegExp(rule.source).test(path)) ?? null;
}

/**
 * Every address of the previous site (its sitemap.xml and router, fetched
 * 2026-10-08) with where it must end up. `status: 200` = the same address
 * exists in the new site. The unit test and e2e/seo.spec.ts check each one.
 */
export const legacyUrls: { path: string; status: 200 | 301 | 307; to?: string }[] = [
  { path: "/pl", status: 200 },
  { path: "/en", status: 200 },
  { path: "/pl/o-mnie", status: 200 },
  { path: "/en/about", status: 200 },
  { path: "/pl/kontakt", status: 200 },
  { path: "/en/contact", status: 200 },
  { path: "/en/services", status: 200 },
  { path: "/pl/projekty", status: 301, to: "/pl" },
  { path: "/en/projects", status: 301, to: "/en" },
  { path: "/projects", status: 301, to: "/pl" },
  { path: "/pl/umiejetnosci", status: 301, to: "/pl/o-mnie#umiejetnosci" },
  { path: "/en/skills", status: 301, to: "/en/about#skills" },
  { path: "/skills", status: 301, to: "/pl/o-mnie#umiejetnosci" },
  { path: "/contact", status: 301, to: "/pl/kontakt" },
  { path: "/me", status: 301, to: "/pl" },
  { path: "/auth", status: 301, to: "/pl" },
  { path: "/stats", status: 301, to: "/pl" },
  { path: "/pl/blog", status: 301, to: "/pl/oferta" },
  { path: "/en/blog", status: 301, to: "/en/services" },
  { path: "/pl/blog/kategoria/inwestycja-w-strone", status: 301, to: "/pl/oferta" },
  { path: "/pl/blog/kategoria/zanim-zlecisz", status: 301, to: "/pl/oferta" },
  { path: "/pl/blog/kategoria/strona-ktora-sprzedaje", status: 301, to: "/pl/oferta" },
  { path: "/pl/blog/kategoria/google-seo", status: 301, to: "/pl/oferta" },
  { path: "/pl/blog/firma-wyrosla-ponad-swoja-strone", status: 301, to: "/pl/oferta" },
  { path: "/pl/blog/dlaczego-strony-maja-rozne-ceny", status: 301, to: "/pl/oferta" },
  { path: "/pl/blog/ruch-na-stronie-ale-brak-zapytan", status: 301, to: "/pl/oferta" },
  { path: "/en/blog/category/investing-in-a-website", status: 301, to: "/en/services" },
  { path: "/en/blog/category/before-you-hire", status: 301, to: "/en/services" },
  { path: "/en/blog/category/sites-that-sell", status: 301, to: "/en/services" },
  { path: "/en/blog/category/google-seo", status: 301, to: "/en/services" },
  { path: "/en/blog/business-outgrew-its-website", status: 301, to: "/en/services" },
  { path: "/en/blog/why-websites-have-different-prices", status: 301, to: "/en/services" },
  { path: "/en/blog/traffic-but-no-clients", status: 301, to: "/en/services" },
  { path: "/pl/uslugi", status: 307, to: "/pl/oferta" },
  { path: "/pl/uslugi/strony-internetowe", status: 307, to: "/pl/oferta" },
  { path: "/pl/uslugi/landing-page", status: 307, to: "/pl/oferta" },
  { path: "/pl/uslugi/sklep-internetowy", status: 307, to: "/pl/oferta" },
  { path: "/pl/uslugi/redesign-strony", status: 307, to: "/pl/oferta" },
  { path: "/pl/uslugi/cennik", status: 307, to: "/pl/oferta#cennik" },
  { path: "/en/services/website-development", status: 307, to: "/en/services" },
  { path: "/en/services/landing-pages", status: 307, to: "/en/services" },
  { path: "/en/services/ecommerce-development", status: 307, to: "/en/services" },
  { path: "/en/services/website-redesign", status: 307, to: "/en/services" },
  { path: "/en/services/pricing", status: 307, to: "/en/services#pricing" },
  { path: "/pl/proces", status: 307, to: "/pl/oferta#proces" },
  { path: "/en/process", status: 307, to: "/en/services#process" },
  { path: "/process", status: 307, to: "/pl/oferta#proces" },
  { path: "/pl/strony-internetowe-warszawa", status: 307, to: "/pl/oferta" },
];
