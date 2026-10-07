import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import baseImage from "@/public/character/base.jpg";
import { projects } from "@/content/projects";
import type { Project } from "@/content/projects/schema";
import { getDictionary, type Dictionary } from "@/content/dictionaries";
import { characterBoxCss } from "@/lib/character-box";
import { INFO_SLOTS, assignSlots, type Slot } from "@/lib/desktop-slots";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { CV_PATH, hasCv } from "@/lib/site";
import type { GlyphName } from "@/components/ui/glyphs";
import { Dock } from "./Dock";
import { DocIcon, TileIcon } from "./FileIcons";
import { TopBar } from "./TopBar";
import s from "./desktop.module.css";

const slotStyle = (slot: Slot) => ({ "--sx": slot.x, "--sy": slot.y }) as CSSProperties;

export function Desktop({ lang, children }: { lang: Locale; children?: ReactNode }) {
  const dict = getDictionary(lang);
  const placed = assignSlots(projects);
  const infoFiles: { key: keyof typeof INFO_SLOTS; label: string; href: string; glyph: GlyphName; download?: boolean }[] = [
    { key: "about", label: dict.files.about, href: href(lang, "about"), glyph: "user" },
    { key: "offer", label: dict.files.offer, href: href(lang, "offer"), glyph: "list" },
  ];
  if (hasCv()) infoFiles.push({ key: "cv", label: dict.files.cv, href: CV_PATH, glyph: "pdf" });

  return (
    <div className={s.root}>
      <style>{characterBoxCss(":root")}</style>
      <TopBar lang={lang} dict={dict} />

      <main>
        <h1 className="sr-only">{dict.desktop.heading}</h1>

        <div className={s.stage}>
          <Image
            src={baseImage}
            alt={dict.desktop.characterAlt}
            className={s.character}
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 768px) and (min-height: 540px) and (min-aspect-ratio: 5/6) 180vh, 280vw"
            quality={80}
            draggable={false}
          />
        </div>

        <nav aria-label={dict.desktop.filesLabel}>
          <ul className={s.files}>
            {placed.map(({ item, slot }) => (
              <li key={item.slug} className={`${s.slot} ${slot.size === "hero" ? s.hero : ""}`} style={slotStyle(slot)}>
                <ProjectFile project={item} lang={lang} dict={dict} hero={slot.size === "hero"} />
              </li>
            ))}
            {infoFiles.map((file) => (
              <li key={file.key} className={s.slot} style={slotStyle(INFO_SLOTS[file.key])}>
                <a className={s.file} href={file.href} {...(file.key === "cv" ? { download: true } : {})}>
                  <DocIcon glyph={file.glyph} className={s.doc} />
                  <span className={s.tile}>
                    <TileIcon glyph={file.glyph} />
                  </span>
                  <span className={s.label}>{file.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {children}
      </main>

      <Dock lang={lang} dict={dict} />
    </div>
  );
}

function ProjectFile({ project, lang, dict, hero }: { project: Project; lang: Locale; dict: Dictionary; hero: boolean }) {
  return (
    <Link className={s.file} href={href(lang, "project", project.slug)}>
      <span className={s.thumb}>
        <Image
          src={project.thumb.src}
          width={project.thumb.width}
          height={project.thumb.height}
          alt=""
          sizes={hero ? "(min-width: 768px) 260px, 45vw" : "100px"}
          draggable={false}
        />
      </span>
      <span className={s.label}>
        {project.title[lang]}
        {project.isNew && <span className={s.badge}>{dict.files.badgeNew}</span>}
      </span>
    </Link>
  );
}
