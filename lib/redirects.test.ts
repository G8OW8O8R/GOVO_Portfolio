import { describe, expect, it } from "vitest";
import { legacyRedirects, legacyUrls, matchRedirect, nextRedirects } from "./redirects";
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
    expect(rule?.status).toBe(status);
    expect(rule?.destination).toBe(to);
  });

  it("never touches the new pages", () => {
    for (const path of ["/pl", "/en", "/pl/projekty/obok", "/en/projects/obok", "/pl/oferta", "/en/services", "/pl/o-mnie", "/en/about", "/pl/cv"]) {
      expect(matchRedirect(path), path).toBeNull();
    }
  });

  it("lands on a new page in one hop (no chains)", () => {
    for (const { destination } of legacyRedirects) {
      expect(isNewPage(pathOnly(destination)), destination).toBe(true);
      expect(matchRedirect(pathOnly(destination)), destination).toBeNull();
    }
  });

  it("only the pages the service pages will replace are temporary", () => {
    for (const rule of legacyRedirects) expect(rule.status === 307, rule.source).toBe(rule.replacedBy === "service-pages");
  });

  it("maps 301 to statusCode and 307 to permanent: false for Next", () => {
    const rules = nextRedirects([
      { source: "/a", destination: "/pl", status: 301 },
      { source: "/b", destination: "/pl", status: 307, replacedBy: "service-pages" },
    ]);
    expect(rules).toEqual([
      { source: "/a", destination: "/pl", statusCode: 301 },
      { source: "/b", destination: "/pl", permanent: false },
    ]);
  });

  it("matches segment patterns like Next", () => {
    const rules = legacyRedirects;
    expect(matchRedirect("/pl/strony-internetowe-krakow", rules)?.destination).toBe("/pl/oferta");
    expect(matchRedirect("/pl/strony-internetowe", rules)).toBeNull();
    expect(matchRedirect("/en/services/a/b", rules)?.destination).toBe("/en/services");
    expect(matchRedirect("/pl/blog/kategoria/x", rules)?.destination).toBe("/pl/oferta");
  });
});
