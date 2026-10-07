import { describe, expect, it } from "vitest";
import {
  alternates,
  closeMode,
  href,
  localizedSegmentRules,
  openMode,
  switchLocalePath,
  windowHref,
  windowKeyForPath,
} from "./routes";

describe("windows", () => {
  it("finds the window for a pathname in both languages", () => {
    expect(windowKeyForPath("/pl")).toBeNull();
    expect(windowKeyForPath("/pl/o-mnie")).toBe("about");
    expect(windowKeyForPath("/en/about")).toBe("about");
    expect(windowKeyForPath("/en/services")).toBe("offer");
    expect(windowKeyForPath("/pl/kontakt")).toBe("contact");
    expect(windowKeyForPath("/en/cv")).toBe("cv");
    expect(windowKeyForPath("/pl/projekty/obok")).toBe("project-obok");
    expect(windowKeyForPath("/pl/projekty")).toBeNull();
    expect(windowKeyForPath("/pl/nieznane")).toBeNull();
  });

  it("builds window URLs", () => {
    expect(windowHref("pl", "offer")).toBe("/pl/oferta");
    expect(windowHref("en", "cv")).toBe("/en/cv");
    expect(windowHref("en", "project-obok")).toBe("/en/projects/obok");
  });

  it("pushes from the desktop, replaces between windows, closes back to the desktop", () => {
    expect(openMode(false)).toBe("push");
    expect(openMode(true)).toBe("replace");
    expect(closeMode(true)).toBe("back");
    expect(closeMode(false)).toBe("replace");
  });
});

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
