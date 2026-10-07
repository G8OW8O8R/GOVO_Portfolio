import { describe, expect, it } from "vitest";
import { alternates, href, localizedSegmentRules, switchLocalePath } from "./routes";

describe("href", () => {
  it("builds localized paths", () => {
    expect(href("pl", "home")).toBe("/pl");
    expect(href("en", "about")).toBe("/en/about");
    expect(href("pl", "offer")).toBe("/pl/oferta");
    expect(href("pl", "project", "obok")).toBe("/pl/projekty/obok");
    expect(href("en", "project", "obok")).toBe("/en/projects/obok");
  });
});

describe("switchLocalePath", () => {
  it("maps a page to its counterpart", () => {
    expect(switchLocalePath("/pl", "en")).toBe("/en");
    expect(switchLocalePath("/pl/o-mnie", "en")).toBe("/en/about");
    expect(switchLocalePath("/en/contact", "pl")).toBe("/pl/kontakt");
    expect(switchLocalePath("/en/projects/obok", "pl")).toBe("/pl/projekty/obok");
  });

  it("falls back to home for unknown paths", () => {
    expect(switchLocalePath("/pl/nieznane", "en")).toBe("/en");
    expect(switchLocalePath("/", "en")).toBe("/en");
  });
});

describe("alternates", () => {
  it("lists every language plus x-default (Polish)", () => {
    expect(alternates("en", "contact")).toEqual({
      canonical: "/en/contact",
      languages: { pl: "/pl/kontakt", en: "/en/contact", "x-default": "/pl/kontakt" },
    });
  });
});

describe("localizedSegmentRules", () => {
  it("maps English URLs onto the Polish folders", () => {
    expect(localizedSegmentRules()).toContainEqual({ english: "/en/about", internal: "/en/o-mnie" });
    expect(localizedSegmentRules()).toContainEqual({
      english: "/en/projects/:slug",
      internal: "/en/projekty/:slug",
    });
  });
});
