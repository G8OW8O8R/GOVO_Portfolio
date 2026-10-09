import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { offer } from "@/content/profile/offer";
import { skills } from "@/content/profile/skills";
import { projects } from "@/content/projects";
import { DESKTOP_MEDIA } from "./character-box";
import { IMAGE_FORMATS, IMAGE_GROUPS, variantPath, type ImageManifest } from "./image-groups";
import { imageKey, imageRefFrom, imageSetFrom, srcsets } from "./images";
import generated from "./images.generated.json";

const manifest: ImageManifest = {
  "skills/ux-ui": { group: "skills", hash: "0123abcd", width: 144, height: 144, placeholder: "data:image/webp;base64,AA" },
};

describe("srcsets", () => {
  it("lists AVIF and WebP in the group's two widths with the desktop query in sizes", () => {
    const s = srcsets({ key: "skills/ux-ui", hash: "0123abcd", group: "skills" });
    expect(s.avif).toBe("/img/skills/ux-ui.0123abcd.72.avif 72w, /img/skills/ux-ui.0123abcd.144.avif 144w");
    expect(s.webp).toBe("/img/skills/ux-ui.0123abcd.72.webp 72w, /img/skills/ux-ui.0123abcd.144.webp 144w");
    expect(s.src).toBe("/img/skills/ux-ui.0123abcd.72.webp");
    expect(s.sizes).toBe(`${DESKTOP_MEDIA} 72px, 56px`);
  });

  it("leaves out the formats a group doesn't write", () => {
    const s = srcsets({ key: "character/base-mobile", hash: "ab", group: "characterMobile" }, "50vw");
    expect(s.avif).toContain("/img/character/base-mobile.ab.1520.avif 1520w");
    expect(s.webp).toBe("");
    expect(s.src).toBe("");
  });

  it("takes sizes of the place it is shown in when given", () => {
    expect(srcsets({ key: "projects/obok/cover", hash: "ff", group: "cover" }, "232px").sizes).toBe("232px");
  });
});

describe("imageSetFrom", () => {
  it("finds a picture by its public path, with or without the leading slash and extension", () => {
    for (const path of ["/skills/ux-ui.png", "skills/ux-ui", "/skills/ux-ui.PNG"]) {
      expect(imageSetFrom(manifest, path)).toMatchObject({ width: 144, height: 144, placeholder: "data:image/webp;base64,AA" });
    }
    expect(imageKey("/projects/obok/scenes/sunny.jpg")).toBe("projects/obok/scenes/sunny");
  });

  it("is null for a picture that isn't generated (neutral placeholder)", () => {
    expect(imageSetFrom(manifest, "/skills/new-skill.png")).toBeNull();
    expect(imageRefFrom(manifest, "/skills/new-skill.png")).toBeNull();
  });

  it("gives preloads the same files as the picture, without the placeholder", () => {
    const ref = imageRefFrom(manifest, "/skills/ux-ui.png")!;
    expect(ref).toEqual({ key: "skills/ux-ui", hash: "0123abcd", group: "skills" });
    expect(srcsets(ref)).toEqual(expect.objectContaining({ avif: imageSetFrom(manifest, "/skills/ux-ui.png")!.avif }));
  });
});

describe("generated pictures", () => {
  const list = generated as ImageManifest;

  it("have at least two ascending widths per group", () => {
    for (const group of Object.values(IMAGE_GROUPS)) {
      expect(group.widths.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < group.widths.length; i++) expect(group.widths[i - 1]).toBeLessThan(group.widths[i]);
    }
  });

  it("exist for every skill, service and project picture of the content", () => {
    const paths = [
      ...skills.categories.flatMap((c) => c.skills.map((s) => `/skills/${s.id}.png`)),
      ...skills.workflow.steps.map((s) => `/skills/${s.id}.png`),
      ...offer.services.map((s) => `/services/${s.thumb}.png`),
      ...projects.flatMap((p) => [
        p.icon,
        `/projects/${p.slug}/cover.jpg`,
        p.caseStudy.showreel.poster,
        ...p.caseStudy.solutions.map((s) => s.shot.src),
        ...p.caseStudy.assets.gallery.map((s) => s.src),
      ]),
      "/icons/o-mnie.png",
      "/icons/oferta.png",
      "/icons/cv.png",
    ];
    const missing = paths.filter((p) => !list[imageKey(p)]);
    expect(missing, "run pnpm images").toEqual([]);
  });

  it("have every variant file in public/img and a small placeholder", () => {
    for (const [key, entry] of Object.entries(list)) {
      const group = IMAGE_GROUPS[entry.group];
      for (const width of group.widths) {
        for (const format of ("formats" in group && group.formats) || IMAGE_FORMATS) {
          expect(existsSync(join("public", variantPath(key, entry.hash, width, format))), `${key} ${width} ${format}`).toBe(true);
        }
      }
      expect(entry.placeholder).toMatch(/^data:image\/webp;base64,/);
      expect(entry.placeholder.length).toBeLessThan(600);
    }
  });
});
