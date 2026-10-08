/**
 * Redirects from the previous site on this domain, wired in
 * next.config.ts, all 301. Addresses that exist in both sites need nothing:
 * the home pages, About me, Contact, /en/services and the service and local
 * pages, which kept their addresses (/pl/uslugi/landing-page,
 * /pl/strony-internetowe-warszawa …).
 *
 * Redirected: the concept projects, the blog, the skills page (now a tab of
 * About me), the old unprefixed routes, the service list, the pricing page
 * (now /pl/cennik) and the process page (a tab of the Offer).
 *
 * First matching rule wins (as in Next), so specific rules come first.
 * Patterns: `:name` = one segment, `:name*` = zero or more, `:name+` = one or more.
 */
export type Redirect = { source: string; destination: string };

const moved = (source: string, destination: string): Redirect => ({ source, destination });

export const legacyRedirects: Redirect[] = [
  // concept projects (one list page, no detail pages) → the desktop with Obok
  moved("/pl/projekty", "/pl"),
  moved("/en/projects", "/en"),
  moved("/projects", "/pl"),
  // blog: articles, categories and the list → Offer
  moved("/pl/blog/:path*", "/pl/oferta"),
  moved("/en/blog/:path*", "/en/services"),
  // skills → the Skills tab of About me
  moved("/pl/umiejetnosci", "/pl/o-mnie#umiejetnosci"),
  moved("/en/skills", "/en/about#skills"),
  moved("/skills", "/pl/o-mnie#umiejetnosci"),
  // old unprefixed routes and private pages (never indexed)
  moved("/contact", "/pl/kontakt"),
  moved("/me", "/pl"),
  moved("/auth", "/pl"),
  moved("/stats", "/pl"),
  // the service list and the pricing page; the service pages themselves kept their addresses
  moved("/pl/uslugi", "/pl/oferta"),
  moved("/pl/uslugi/cennik", "/pl/cennik"),
  moved("/en/services/pricing", "/en/pricing"),
  // process → the Process tab of the Offer
  moved("/pl/proces", "/pl/oferta#proces"),
  moved("/en/process", "/en/services#process"),
  moved("/process", "/pl/oferta#proces"),
];

/** For next.config.ts: a real 301 (Next's `permanent: true` would give 308). */
export function nextRedirects(rules: Redirect[] = legacyRedirects) {
  return rules.map(({ source, destination }) => ({ source, destination, statusCode: 301 as const }));
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
export const legacyUrls: { path: string; status: 200 | 301; to?: string }[] = [
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
  { path: "/pl/uslugi", status: 301, to: "/pl/oferta" },
  { path: "/pl/uslugi/strony-internetowe", status: 200 },
  { path: "/pl/uslugi/landing-page", status: 200 },
  { path: "/pl/uslugi/sklep-internetowy", status: 200 },
  { path: "/pl/uslugi/redesign-strony", status: 200 },
  { path: "/pl/uslugi/cennik", status: 301, to: "/pl/cennik" },
  { path: "/en/services/website-development", status: 200 },
  { path: "/en/services/landing-pages", status: 200 },
  { path: "/en/services/ecommerce-development", status: 200 },
  { path: "/en/services/website-redesign", status: 200 },
  { path: "/en/services/pricing", status: 301, to: "/en/pricing" },
  { path: "/pl/proces", status: 301, to: "/pl/oferta#proces" },
  { path: "/en/process", status: 301, to: "/en/services#process" },
  { path: "/process", status: 301, to: "/pl/oferta#proces" },
  { path: "/pl/strony-internetowe-warszawa", status: 200 },
];
