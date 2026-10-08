import type { ReactNode } from "react";
import { projects } from "@/content/projects";
import { getDictionary } from "@/content/dictionaries";
import { characterBoxCss } from "@/lib/character-box";
import { INFO_SLOTS, assignSlots } from "@/lib/desktop-slots";
import type { Locale } from "@/lib/i18n";
import { href, windowHref } from "@/lib/routes";
import { hasCv, optionalAsset } from "@/lib/site";
import { windowLayoutCss } from "@/lib/window-layout";
import { Character } from "@/components/character/Character";
import { Cursor } from "@/components/cursor/Cursor";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { DesktopLayer, WindowBackdrop } from "@/components/window/WindowBackdrop";
import { DesktopFiles, type DesktopFile } from "./DesktopFiles";
import { Dock } from "./Dock";
import { Pendant } from "./Pendant";
import { TopBar } from "./TopBar";
import s from "./desktop.module.css";

/** Info file icons: neutral white, same style and size as project icons. */
const INFO_ICONS = { about: "/icons/o-mnie.png", offer: "/icons/oferta.png", cv: "/icons/cv.png" } as const;

export function Desktop({ lang, children }: { lang: Locale; children?: ReactNode }) {
  const dict = getDictionary(lang);

  const files: DesktopFile[] = assignSlots(projects).map(({ item, slot }) => ({
    key: `project-${item.slug}`,
    label: item.title[lang],
    href: href(lang, "project", item.slug),
    icon: item.icon,
    slot,
    badge: item.isNew ? dict.files.badgeNew : undefined,
    preview: {
      title: item.title[lang],
      summary: item.summary[lang],
      cover: `/projects/${item.slug}/cover.jpg`,
      video: optionalAsset(`/projects/${item.slug}/preview.mp4`),
    },
  }));
  const info = (["about", "offer", "cv"] as const).filter((key) => key !== "cv" || hasCv());
  for (const key of info) {
    files.push({ key, label: dict.files[key], href: windowHref(lang, key), icon: INFO_ICONS[key], slot: INFO_SLOTS[key] });
  }

  return (
    <div className={s.root}>
      <style>
        {characterBoxCss(":root") + windowLayoutCss(":root")}
      </style>
      <MotionProvider>
        <DesktopLayer className="contents">
          <TopBar lang={lang} dict={dict} />
          <main className={s.main}>
            <h1 className="sr-only">{dict.desktop.heading}</h1>
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
    </div>
  );
}
