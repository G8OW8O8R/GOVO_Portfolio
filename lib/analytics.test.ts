import { describe, expect, it } from "vitest";
import {
  ANALYTICS_HOST,
  analyticsWebsiteId,
  clientIp,
  eventFromAttributes,
  isAutomated,
  pathEvents,
  readOptParam,
  relayHeaders,
  trackAttrs,
} from "./analytics";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

describe("analytics", () => {
  it("is on in Vercel production (or end-to-end tests) with a website id only", () => {
    const id = "0b5c3f6e-0000-4000-8000-000000000000";
    expect(analyticsWebsiteId({ VERCEL_ENV: "production", NEXT_PUBLIC_UMAMI_WEBSITE_ID: id })).toBe(id);
    expect(analyticsWebsiteId({ ANALYTICS_E2E: "1", NEXT_PUBLIC_UMAMI_WEBSITE_ID: id })).toBe(id);
    expect(analyticsWebsiteId({ VERCEL_ENV: "preview", NEXT_PUBLIC_UMAMI_WEBSITE_ID: id })).toBeNull();
    expect(analyticsWebsiteId({ NEXT_PUBLIC_UMAMI_WEBSITE_ID: id })).toBeNull();
    expect(analyticsWebsiteId({ VERCEL_ENV: "production", NEXT_PUBLIC_UMAMI_WEBSITE_ID: " " })).toBeNull();
  });

  it("sends from the site's own host only", () => {
    expect(ANALYTICS_HOST).toBe("www.govodigital.com");
  });

  it("leaves out automated browsers", () => {
    expect(isAutomated({ webdriver: false, userAgent: CHROME })).toBe(false);
    expect(isAutomated({ webdriver: true, userAgent: CHROME })).toBe(true);
    expect(isAutomated({ userAgent: CHROME.replace("Chrome/", "HeadlessChrome/") })).toBe(true);
    expect(isAutomated({ userAgent: `${CHROME} Chrome-Lighthouse` })).toBe(true);
  });

  it("reads the opt-out / opt-in parameter and keeps the rest of the query", () => {
    expect(readOptParam("?nie-licz-mnie")).toEqual({ action: "out", search: "" });
    expect(readOptParam("?dont-count-me=1&temat=strona")).toEqual({ action: "out", search: "?temat=strona" });
    expect(readOptParam("?temat=strona&licz-mnie")).toEqual({ action: "in", search: "?temat=strona" });
    expect(readOptParam("?count-me")).toEqual({ action: "in", search: "" });
    expect(readOptParam("?temat=strona")).toBeNull();
    expect(readOptParam("")).toBeNull();
  });

  it("counts a window opened on the desktop, and every service page view", () => {
    expect(pathEvents(null, "/pl")).toEqual([]);
    // entered directly: a page view only
    expect(pathEvents(null, "/pl/o-mnie")).toEqual([]);
    expect(pathEvents("/pl", "/pl/o-mnie")).toEqual([{ name: "window-open", data: { window: "about" } }]);
    expect(pathEvents("/en", "/en/projects/obok")).toEqual([{ name: "window-open", data: { window: "project-obok" } }]);
    expect(pathEvents("/pl/kontakt", "/pl/prywatnosc")).toEqual([{ name: "window-open", data: { window: "privacy" } }]);
    expect(pathEvents("/pl/o-mnie", "/pl")).toEqual([]);
    expect(pathEvents("/pl/o-mnie", "/pl/o-mnie")).toEqual([]);
    expect(pathEvents(null, "/pl/uslugi/landing-page")).toEqual([{ name: "service-view", data: { service: "landing-page" } }]);
    expect(pathEvents("/en/services", "/en/services/website-redesign")).toEqual([
      { name: "window-open", data: { window: "service-redesign" } },
      { name: "service-view", data: { service: "redesign" } },
    ]);
  });

  it("round-trips an event through data-track attributes", () => {
    const attrs = trackAttrs("cv-download", { lang: "pl" });
    expect(attrs).toEqual({ "data-track": "cv-download", "data-track-lang": "pl" });
    const list = Object.entries(attrs).map(([name, value]) => ({ name, value }));
    expect(eventFromAttributes([{ name: "href", value: "/cv/CV-PL.pdf" }, ...list])).toEqual({
      name: "cv-download",
      data: { lang: "pl" },
    });
    expect(eventFromAttributes([{ name: "data-track", value: "cta-cooperate" }])).toEqual({ name: "cta-cooperate" });
    expect(eventFromAttributes([{ name: "href", value: "/" }])).toBeNull();
  });

  it("finds the visitor's IP for the relay", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBeNull();
  });

  it("relays the visitor's IP and user agent to Umami, and nothing else", () => {
    const headers = relayHeaders(
      new Headers({
        "x-forwarded-for": "203.0.113.7, 76.76.21.21",
        "user-agent": "Mozilla/5.0 Test",
        "content-type": "application/json",
        cookie: "a=b",
        "x-vercel-id": "arn1::abc",
      }),
    );
    for (const name of ["x-forwarded-for", "x-real-ip", "x-client-ip"]) expect(headers.get(name)).toBe("203.0.113.7");
    expect(headers.get("user-agent")).toBe("Mozilla/5.0 Test");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("cookie")).toBeNull();
    expect(headers.get("x-vercel-id")).toBeNull();
    expect(relayHeaders(new Headers({ "x-real-ip": "198.51.100.2" })).get("x-client-ip")).toBe("198.51.100.2");
    expect(relayHeaders(new Headers()).has("x-forwarded-for")).toBe(false);
  });
});
