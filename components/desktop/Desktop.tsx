import type { ReactNode } from "react";
import { projects } from "@/content/projects";
import { getDictionary } from "@/content/dictionaries";
import { offer } from "@/content/profile/offer";
import { skills } from "@/content/profile/skills";
import { characterBoxCss } from "@/lib/character-box";
import { INFO_SLOTS, assignSlots } from "@/lib/desktop-slots";
import { imageRefs, requireImage } from "@/lib/image-manifest";
import type { Locale } from "@/lib/i18n";
import { href, windowHref } from "@/lib/routes";
import { hasCv, optionalAsset } from "@/lib/site";
import { windowLayoutCss } from "@/lib/window-layout";
import { Character } from "@/components/character/Character";
import { Cursor } from "@/components/cursor/Cursor";
import { Intro } from "@/components/intro/Intro";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { DesktopLayer, WindowBackdrop } from "@/components/window/WindowBackdrop";
import { DesktopFiles, type DesktopFile } from "./DesktopFiles";
import { DesktopHeading } from "./DesktopHeading";
import { LoadAhead } from "./LoadAhead";
import { Dock } from "./Dock";
import { Pendant } from "./Pendant";
import { TopBar } from "./TopBar";
import s from "./desktop.module.css";

/** Info file icons: neutral white, same style and size as project icons. */
const INFO_ICONS = { about: "/icons/o-mnie.png", offer: "/icons/oferta.png", cv: "/icons/cv.png" } as const;

/**
 * Pictures of each window. `first`: what its first screen shows, loaded when
 * the file is hovered, focused or touched (About me shows none, so its skill
 * thumbnails); `all`: everything, loaded ahead after the intro.
 */
const skillThumbs = skills.categories.flatMap((c) => c.skills.map((s) => `/skills/${s.id}.png`));
const serviceThumbs = offer.services.map((s) => `/services/${s.thumb}.png`);
const INFO_PICTURES: Record<keyof typeof INFO_ICONS, { first: string[]; all: string[] }> = {
  about: { first: skillThumbs, all: [...skillThumbs, ...skills.workflow.steps.map((s) => `/skills/${s.id}.png`)] },
  offer: { first: serviceThumbs, all: [...serviceThumbs, ...projects.map((p) => `/projects/${p.slug}/cover.jpg`)] },
  cv: { first: [], all: [] },
};

function projectPictures({ caseStudy: cs }: (typeof projects)[number]) {
  return {
    first: [cs.showreel.poster],
    all: [cs.showreel.poster, ...cs.solutions.map((s) => s.shot.src), ...cs.assets.gallery.map((s) => s.src)],
  };
}

export function Desktop({ lang, children }: { lang: Locale; children?: ReactNode }) {
  const dict = getDictionary(lang);

  const files: DesktopFile[] = assignSlots(projects).map(({ item, slot }) => ({
    key: `project-${item.slug}`,
    label: item.title[lang],
    href: href(lang, "project", item.slug),
    icon: requireImage(item.icon),
    slot,
    badge: item.isNew ? dict.files.badgeNew : undefined,
    preload: imageRefs(projectPictures(item).first),
    preview: {
      title: item.title[lang],
      summary: item.summary[lang],
      cover: requireImage(`/projects/${item.slug}/cover.jpg`),
      video: optionalAsset(`/projects/${item.slug}/preview.mp4`),
    },
  }));
  const info = (["about", "offer", "cv"] as const).filter((key) => key !== "cv" || hasCv(lang));
  for (const key of info) {
    files.push({
      key,
      label: dict.files[key],
      href: windowHref(lang, key),
      icon: requireImage(INFO_ICONS[key]),
      slot: INFO_SLOTS[key],
      preload: imageRefs(INFO_PICTURES[key].first),
    });
  }
  // windows loaded ahead after the intro: the files, then Contact (capsule, pendant, dock)
  const aheadWindows = [...files.map((f) => f.href), href(lang, "contact")];
  const ahead = imageRefs([...info.flatMap((key) => INFO_PICTURES[key].all), ...projects.flatMap((p) => projectPictures(p).all)]);

  return (
    <div className={s.root}>
      <style>
        {characterBoxCss(":root") + windowLayoutCss(":root")}
      </style>
      <MotionProvider>
        <DesktopLayer className="contents">
          <TopBar lang={lang} dict={dict} />
          <main className={s.main}>
            <DesktopHeading text={dict.desktop.heading} />
            <div className={s.stage}>
              <Character alt={dict.desktop.characterAlt} />
              <Pendant href={href(lang, "contact")} label={dict.desktop.pendantLabel} />
            </div>
            <DesktopFiles
              files={files}
              labels={{
                files: dict.desktop.filesLabel,
                tidy: dict.desktop.tidy,
                tidyLabel: dict.desktop.tidyLabel,
                hint: dict.desktop.fileHint,
                moveHint: dict.desktop.moveHint,
                quickLook: dict.quickLook,
              }}
            />
          </main>
        </DesktopLayer>
        <WindowBackdrop />
        {children}
        <Dock lang={lang} dict={dict} />
        <Cursor labels={dict.cursor} />
      </MotionProvider>
      <Intro files={files.length} />
      <LoadAhead windows={aheadWindows} images={ahead} />
    </div>
  );
}
