import { describe, expect, it } from "vitest";
import { getProject } from "@/content/projects";
import { SITE_URL } from "@/content/profile/contact";
import { breadcrumbJsonLd, creativeWorkJsonLd, pageMetadata, personJsonLd, serializeJsonLd } from "./seo";

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
    expect(person).toMatchObject({ "@type": "Person", name: "Piotr Goworek", url: `${SITE_URL}/pl` });
    expect(person.sameAs).toEqual(expect.arrayContaining([expect.stringContaining("linkedin.com")]));
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
