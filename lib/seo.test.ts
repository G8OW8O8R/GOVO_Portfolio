import { describe, expect, it } from "vitest";
import { getProject } from "@/content/projects";
import { SITE_URL } from "@/content/profile/contact";
import { pricing } from "@/content/profile/pricing";
import { formatPriceFrom } from "./format";
import {
  breadcrumbJsonLd,
  creativeWorkJsonLd,
  faqJsonLd,
  organizationJsonLd,
  packagesById,
  pageMetadata,
  personJsonLd,
  pricingJsonLd,
  serializeJsonLd,
  serviceJsonLd,
  titleWithPrice,
  websiteJsonLd,
  withPrice,
} from "./seo";

describe("pageMetadata", () => {
  it("has canonical, hreflang and a full Open Graph block", () => {
    const meta = pageMetadata({ lang: "en", route: "project", slug: "obok", title: "T", description: "D", image: "/projects/obok/og.jpg" });
    expect(meta.alternates).toEqual({
      canonical: "/en/projects/obok",
      languages: { pl: "/pl/projekty/obok", en: "/en/projects/obok", "x-default": "/pl/projekty/obok" },
    });
    expect(meta.openGraph).toMatchObject({
      url: "/en/projects/obok",
      locale: "en_US",
      alternateLocale: ["pl_PL"],
      siteName: "GOVO DIGITAL",
      images: [{ url: "/projects/obok/og.jpg", width: 1200, height: 630 }],
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back to the site share image", () => {
    const meta = pageMetadata({ lang: "pl", route: "home", title: "T", description: "D" });
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: "/og.jpg" })]);
  });
});

describe("structured data", () => {
  it("person links the profiles and the brand", () => {
    const person = personJsonLd("pl");
    expect(person).toMatchObject({ "@type": "Person", name: "Piotr Goworek", url: `${SITE_URL}/pl`, email: "kontakt@govodigital.com" });
    expect(person.sameAs).toEqual(expect.arrayContaining([expect.stringContaining("linkedin.com")]));
  });

  it("website carries the brand name for search results", () => {
    expect(websiteJsonLd()).toMatchObject({
      "@type": "WebSite",
      name: "GOVO DIGITAL",
      alternateName: "GOVO Digital",
      url: "https://www.govodigital.com/",
      publisher: { "@id": `${SITE_URL}/#organization` },
    });
  });

  it("organization has the logo, the founder and every profile", () => {
    const org = organizationJsonLd();
    expect(org).toMatchObject({
      "@type": "Organization",
      name: "GOVO DIGITAL",
      url: `${SITE_URL}/`,
      logo: { url: `${SITE_URL}/icon-512.png` },
      email: "kontakt@govodigital.com",
      founder: { "@id": `${SITE_URL}/#person`, name: "Piotr Goworek" },
    });
    expect(org.sameAs).toEqual([
      "https://www.linkedin.com/in/piotrgoworek/",
      "https://www.instagram.com/govo.web/",
      "https://github.com/G8OW8O8R",
    ]);
    expect(personJsonLd("en").worksFor).toMatchObject({ "@id": org["@id"] });
  });

  it("creative work points to the person and the absolute case study URL", () => {
    const work = creativeWorkJsonLd(getProject("obok")!, "en");
    expect(work).toMatchObject({
      "@type": "CreativeWork",
      url: `${SITE_URL}/en/projects/obok`,
      image: `${SITE_URL}/projects/obok/og.jpg`,
      creator: { "@id": `${SITE_URL}/#person` },
    });
  });

  it("breadcrumbs start at the home page with absolute URLs", () => {
    const list = breadcrumbJsonLd("pl", [{ name: "Obok", path: "/pl/projekty/obok" }]);
    expect(list.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "GOVO DIGITAL", item: `${SITE_URL}/pl` },
      { "@type": "ListItem", position: 2, name: "Obok", item: `${SITE_URL}/pl/projekty/obok` },
    ]);
  });

  it("serialises without a way to close the script", () => {
    expect(serializeJsonLd({ name: "</script><script>x" })).not.toContain("<");
  });
});

describe("prices from pricing.ts", () => {
  const pkgs = packagesById(["strona-firmowa", "wizytowka"]);
  const lowest = Math.min(...pkgs.map((p) => p.from));

  it("fills the lowest price and the first package's time", () => {
    expect(withPrice("Strony {price}, gotowe {time}.", pkgs, "pl")).toBe(
      `Strony ${formatPriceFrom(lowest, "pl")}, gotowe ${pkgs[0].time.pl}.`,
    );
    expect(withPrice("{price}", pkgs, "en")).toMatch(/^from PLN\s\d/);
  });

  it("puts the price in the title before the site name", () => {
    expect(titleWithPrice("Landing page", packagesById(["landing-page"]), "en")).toMatch(/^Landing page – from PLN\s[\d,]+ \| GOVO DIGITAL$/);
  });

  it("refuses an unknown package", () => {
    expect(() => packagesById(["nope"])).toThrow();
  });
});

describe("service structured data", () => {
  it("offers each package from its net price, served in the city of a local page", () => {
    const data = serviceJsonLd({
      lang: "pl",
      name: "Strony",
      description: "D",
      path: "/pl/strony-internetowe-warszawa",
      packages: packagesById(["wizytowka"]),
      city: "Warszawa",
    });
    expect(data).toMatchObject({
      "@type": "Service",
      url: `${SITE_URL}/pl/strony-internetowe-warszawa`,
      provider: { "@id": `${SITE_URL}/#person` },
      areaServed: { "@type": "City", name: "Warszawa" },
    });
    expect(data.offers).toEqual([
      expect.objectContaining({
        "@type": "Offer",
        priceSpecification: expect.objectContaining({ minPrice: pricing.packages[0].from, priceCurrency: "PLN", valueAddedTaxIncluded: false }),
      }),
    ]);
  });

  it("is served in Poland on Polish service pages and without a limit in English", () => {
    const page = (lang: "pl" | "en") =>
      serviceJsonLd({ lang, name: "S", description: "D", path: `/${lang}/x`, packages: packagesById(["landing-page"]) });
    expect(page("pl").areaServed).toEqual({ "@type": "Country", name: "Polska" });
    expect(page("en")).not.toHaveProperty("areaServed");
    const warsaw = serviceJsonLd({ lang: "en", name: "S", description: "D", path: "/en/web-design-warsaw", packages: packagesById(["wizytowka"]), city: "Warsaw" });
    expect(warsaw.areaServed).toEqual({ "@type": "City", name: "Warsaw" });
  });

  it("builds the FAQ from the visible questions, in order", () => {
    const data = faqJsonLd([
      { q: "Q1?", a: "A1." },
      { q: "Q2?", a: "A2." },
    ]);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toEqual([
      { "@type": "Question", name: "Q1?", acceptedAnswer: { "@type": "Answer", text: "A1." } },
      { "@type": "Question", name: "Q2?", acceptedAnswer: { "@type": "Answer", text: "A2." } },
    ]);
  });

  it("lists every package and the care plan in the pricing catalogue", () => {
    const data = pricingJsonLd("en", "/en/pricing", (id) => (id === "redesign" ? "/en/services/website-redesign" : undefined));
    const items = data.itemListElement as Record<string, unknown>[];
    expect(items).toHaveLength(pricing.packages.length + 1);
    expect(items.find((i) => i.url === `${SITE_URL}/en/services/website-redesign`)).toBeTruthy();
    expect(items.at(-1)?.priceSpecification).toMatchObject({ "@type": "UnitPriceSpecification", unitCode: "MON" });
  });
});
