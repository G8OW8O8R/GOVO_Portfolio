import { describe, expect, it } from "vitest";
import {
  alternates,
  closeMode,
  fileKeyForWindow,
  href,
  isOfferPage,
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

  it("tells the offer from the service pages and finds pricing and local pages", () => {
    expect(windowKeyForPath("/en/services/landing-pages")).toBe("service-landing-page");
    expect(windowKeyForPath("/pl/uslugi/redesign-strony")).toBe("service-redesign");
    expect(windowKeyForPath("/pl/uslugi")).toBeNull();
    expect(windowKeyForPath("/en/services/nope")).toBeNull();
    expect(windowKeyForPath("/pl/cennik")).toBe("pricing");
    expect(windowKeyForPath("/en/pricing")).toBe("pricing");
    expect(windowKeyForPath("/pl/strony-internetowe-warszawa")).toBe("local-warszawa");
    expect(windowKeyForPath("/en/web-design-warsaw")).toBe("local-warszawa");
    expect(windowKeyForPath("/pl/strony-internetowe-krakow")).toBeNull();
  });

  it("offer pages grow from and minimise to the Offer file", () => {
    expect(isOfferPage("service-redesign")).toBe(true);
    expect(fileKeyForWindow("pricing")).toBe("offer");
    expect(fileKeyForWindow("local-warszawa")).toBe("offer");
    expect(fileKeyForWindow("about")).toBe("about");
  });

  it("builds window URLs", () => {
    expect(windowHref("pl", "offer")).toBe("/pl/oferta");
    expect(windowHref("en", "cv")).toBe("/en/cv");
    expect(windowHref("en", "project-obok")).toBe("/en/projects/obok");
    expect(windowHref("en", "service-sklep-internetowy")).toBe("/en/services/ecommerce-development");
    expect(windowHref("pl", "local-warszawa")).toBe("/pl/strony-internetowe-warszawa");
    expect(windowHref("en", "pricing")).toBe("/en/pricing");
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
    expect(href("pl", "service", "redesign")).toBe("/pl/uslugi/redesign-strony");
    expect(href("en", "local", "warszawa")).toBe("/en/web-design-warsaw");
    expect(href("pl", "pricing")).toBe("/pl/cennik");
  });

  it("refuses a page without a slug or with an unknown one", () => {
    expect(() => href("pl", "service")).toThrow();
    expect(() => href("pl", "service", "nope")).toThrow();
  });
});

describe("switchLocalePath", () => {
  it("maps a page to its counterpart", () => {
    expect(switchLocalePath("/pl", "en")).toBe("/en");
    expect(switchLocalePath("/pl/o-mnie", "en")).toBe("/en/about");
    expect(switchLocalePath("/en/contact", "pl")).toBe("/pl/kontakt");
    expect(switchLocalePath("/en/projects/obok", "pl")).toBe("/pl/projekty/obok");
    expect(switchLocalePath("/pl/uslugi/strony-internetowe", "en")).toBe("/en/services/website-development");
    expect(switchLocalePath("/en/services", "pl")).toBe("/pl/oferta");
    expect(switchLocalePath("/pl/cennik", "en")).toBe("/en/pricing");
    expect(switchLocalePath("/en/web-design-warsaw", "pl")).toBe("/pl/strony-internetowe-warszawa");
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
    expect(localizedSegmentRules()).toContainEqual({ english: "/en/services/:slug", internal: "/en/uslugi/:slug" });
    expect(localizedSegmentRules()).toContainEqual({ english: "/en/pricing", internal: "/en/cennik" });
  });
});
