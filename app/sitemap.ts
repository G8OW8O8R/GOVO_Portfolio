import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { locales } from "@/lib/i18n";
import { alternates, localIds, serviceIds, type RouteKey } from "@/lib/routes";
import { absolute } from "@/lib/seo";

/** Every page in both languages, each with its hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { route: RouteKey; slug?: string; priority: number }[] = [
    { route: "home", priority: 1 },
    ...projects.map(({ slug }) => ({ route: "project" as const, slug, priority: 0.9 })),
    { route: "offer", priority: 0.8 },
    ...serviceIds.map((slug) => ({ route: "service" as const, slug, priority: 0.8 })),
    { route: "pricing", priority: 0.8 },
    ...localIds.map((slug) => ({ route: "local" as const, slug, priority: 0.7 })),
    { route: "about", priority: 0.7 },
    { route: "contact", priority: 0.6 },
    { route: "cv", priority: 0.5 },
    { route: "privacy", priority: 0.3 },
  ];
  return pages.flatMap(({ route, slug, priority }) =>
    locales.map((lang) => {
      const { canonical, languages } = alternates(lang, route, slug);
      return {
        url: absolute(canonical),
        priority,
        alternates: {
          languages: Object.fromEntries(Object.entries(languages).map(([l, path]) => [l, absolute(path)])),
        },
      };
    }),
  );
}
