import { describe, expect, it } from "vitest";
import { CV_TAGS_MAX } from "@/content/profile/schema";
import { skills } from "@/content/profile/skills";
import { cvProjectUrl, cvSkillGroups, displayUrl, selectCvProjects } from "./cv";

const p = (slug: string, year: number, order?: number, last = false) => ({ slug, year, order, listed: !last, cv: { last } });

describe("selectCvProjects", () => {
  it("lists the newest first and the portfolio last", () => {
    const list = selectCvProjects([p("portfolio", 2026, undefined, true), p("old", 2024, 2), p("obok", 2026, 1)]);
    expect(list.map((e) => e.slug)).toEqual(["obok", "old", "portfolio"]);
  });

  it("keeps at most three and never drops the portfolio", () => {
    const list = selectCvProjects([
      p("a", 2023, 1),
      p("b", 2025, 2),
      p("c", 2026, 3),
      p("d", 2024, 4),
      p("portfolio", 2026, undefined, true),
    ]);
    expect(list.map((e) => e.slug)).toEqual(["c", "b", "portfolio"]);
  });

  it("breaks ties within a year by desktop order", () => {
    const list = selectCvProjects([p("second", 2026, 2), p("first", 2026, 1)]);
    expect(list.map((e) => e.slug)).toEqual(["first", "second"]);
  });
});

describe("cv links", () => {
  it("links a project to its case study in the page language and a CV-only entry to the home page", () => {
    expect(cvProjectUrl({ slug: "obok", listed: true }, "pl", "https://www.govodigital.com")).toBe(
      "https://www.govodigital.com/pl/projekty/obok",
    );
    expect(cvProjectUrl({ slug: "obok", listed: true }, "en", "https://www.govodigital.com/")).toBe(
      "https://www.govodigital.com/en/projects/obok",
    );
    expect(cvProjectUrl({ slug: "portfolio", listed: false }, "en", "https://www.govodigital.com")).toBe(
      "https://www.govodigital.com",
    );
  });

  it("prints URLs without protocol, www and trailing slash", () => {
    expect(displayUrl("https://www.linkedin.com/in/piotrgoworek/")).toBe("linkedin.com/in/piotrgoworek");
    expect(displayUrl("https://www.govodigital.com/pl/cv")).toBe("govodigital.com/pl/cv");
  });
});

describe("cvSkillGroups", () => {
  const tag = (pl: string) => ({ pl, en: pl.toUpperCase() });
  it("takes each category's CV short list in the page language", () => {
    const groups = cvSkillGroups(
      [
        { label: { pl: "Frontend", en: "Frontend" }, cvTags: [tag("html"), tag("css")] },
        { label: { pl: "Dane", en: "Data" }, cvTags: [tag("rest")] },
      ],
      "en",
    );
    expect(groups).toEqual([
      { label: "Frontend", tags: ["HTML", "CSS"] },
      { label: "Data", tags: ["REST"] },
    ]);
  });

  it("keeps the CV's lists short and leaves the AI tools to the website", () => {
    for (const c of skills.categories) {
      expect(c.cvTags.length).toBeLessThanOrEqual(CV_TAGS_MAX);
      expect(c.cvTags.map((t) => `${t.pl} ${t.en}`).join(" ")).not.toMatch(/\bAI\b/);
    }
  });
});
