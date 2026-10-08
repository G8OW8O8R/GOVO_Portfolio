import type { Locale } from "./i18n";
import { href } from "./routes";

/** The CV shows at most this many projects on its timeline. */
export const CV_MAX_PROJECTS = 3;

type Entry = { slug: string; year: number; order?: number; listed: boolean; cv: { last: boolean } };

/**
 * Projects on the CV timeline: newest first (year, then desktop order), at
 * most `max`; entries marked `last` (the portfolio itself) always close the
 * list and always fit.
 */
export function selectCvProjects<T extends Entry>(entries: readonly T[], max = CV_MAX_PROJECTS): T[] {
  const last = entries.filter((e) => e.cv.last).slice(0, max);
  const rest = entries
    .filter((e) => !e.cv.last)
    .toSorted((a, b) => b.year - a.year || (a.order ?? Infinity) - (b.order ?? Infinity));
  return [...rest.slice(0, max - last.length), ...last];
}

/** Absolute link of a CV entry: its case study, or the home page for a CV-only entry. */
export function cvProjectUrl(entry: Pick<Entry, "slug" | "listed">, lang: Locale, site: string): string {
  const origin = site.replace(/\/+$/, "");
  return entry.listed ? `${origin}${href(lang, "project", entry.slug)}` : origin;
}

/** URL as printed on paper: no protocol, no "www.", no trailing slash. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

type SkillCategory = {
  label: Record<Locale, string>;
  skills: { cv: boolean; tags: (Record<Locale, string> & { cv: boolean })[] }[];
};

/** Skill groups for the CV: every tag of a category in order, without what is marked `cv: false`. */
export function cvSkillGroups(categories: readonly SkillCategory[], lang: Locale) {
  return categories
    .map((c) => ({
      label: c.label[lang],
      tags: c.skills.filter((s) => s.cv).flatMap((s) => s.tags.filter((t) => t.cv).map((t) => t[lang])),
    }))
    .filter((g) => g.tags.length > 0);
}
