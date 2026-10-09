import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { legacyRedirects, legacyUrls, matchRedirect, nextRedirects, unprefixedTarget } from "./redirects";
import { windowKeyForPath } from "./routes";

const pathOnly = (url: string) => url.split("#")[0];
const isNewPage = (path: string) => /^\/(pl|en)$/.test(path) || windowKeyForPath(path) !== null;

describe("legacy redirects", () => {
  it.each(legacyUrls)("$path → $status $to", ({ path, status, to }) => {
    const rule = matchRedirect(path);
    if (status === 200) {
      expect(rule).toBeNull();
      expect(isNewPage(path)).toBe(true);
      return;
    }
    expect(rule?.destination).toBe(to);
  });

  it("never touches the new pages", () => {
    for (const path of ["/pl", "/en", "/pl/projekty/obok", "/en/projects/obok", "/pl/oferta", "/en/services", "/pl/o-mnie", "/en/about", "/pl/cv", "/pl/cennik", "/en/pricing", "/en/services/special-project", "/en/web-design-warsaw"]) {
      expect(matchRedirect(path), path).toBeNull();
    }
  });

  it("lands on a new page in one hop (no chains)", () => {
    for (const { destination } of legacyRedirects) {
      expect(isNewPage(pathOnly(destination)), destination).toBe(true);
      expect(matchRedirect(pathOnly(destination)), destination).toBeNull();
    }
  });

  it("is permanent: a real 301 for Next", () => {
    expect(nextRedirects([{ source: "/a", destination: "/pl" }])).toEqual([{ source: "/a", destination: "/pl", statusCode: 301 }]);
    expect(legacyUrls.every(({ status }) => status === 200 || status === 301)).toBe(true);
  });

  it("matches segment patterns like Next", () => {
    const rules = legacyRedirects;
    expect(matchRedirect("/pl/uslugi", rules)?.destination).toBe("/pl/oferta");
    expect(matchRedirect("/pl/uslugi/landing-page", rules)).toBeNull();
    expect(matchRedirect("/pl/strony-internetowe-warszawa", rules)).toBeNull();
    expect(matchRedirect("/pl/blog/kategoria/x", rules)?.destination).toBe("/pl/oferta");
    expect(matchRedirect("/pl/blog", rules)?.destination).toBe("/pl/oferta");
  });

  it("sends a path without a language prefix to its final page in one hop", () => {
    for (const [path, to] of [
      ["/", "/pl"],
      ["/o-mnie", "/pl/o-mnie"],
      ["/uslugi/landing-page", "/pl/uslugi/landing-page"],
      ["/uslugi", "/pl/oferta"],
      ["/blog/zanim-zlecisz", "/pl/oferta"],
      ["/umiejetnosci", "/pl/o-mnie#umiejetnosci"],
    ]) {
      expect(unprefixedTarget(path), path).toBe(to);
      expect(matchRedirect(pathOnly(to)), to).toBeNull();
      expect(isNewPage(pathOnly(to)), to).toBe(true);
    }
  });
});

describe("every redirect of the site", () => {
  it("is a 301 (no 307 or 308) and never leads to another redirect", async () => {
    const rules = (await nextConfig.redirects!()) as { source: string; destination: string; statusCode?: number; permanent?: boolean }[];
    expect(rules.length).toBeGreaterThan(legacyRedirects.length);
    for (const rule of rules) {
      expect(rule.statusCode, rule.source).toBe(301);
      expect(rule.permanent, rule.source).toBeUndefined();
      const target = pathOnly(rule.destination).replace(/:\w+/g, "x");
      expect(matchRedirect(target, rules), `${rule.source} → ${rule.destination}`).toBeNull();
    }
  });
});
