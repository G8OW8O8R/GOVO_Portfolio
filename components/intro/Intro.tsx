import type { CSSProperties } from "react";
import { DESKTOP_MEDIA } from "@/lib/character-box";
import { FLASH_FROM, fullTimeline, shortTimeline } from "@/lib/intro";
import { Logo } from "@/components/ui/Logo";
import { IntroDirector } from "./IntroDirector";
import s from "./intro.module.css";

/**
 * Intro "Przebudzenie" (lib/intro.ts): server-rendered
 * overlay over the already rendered desktop. Durations for desktop and phone
 * as custom properties, so the parts that run before hydration (logo outline,
 * the short version) use the same numbers as the director.
 */
export function Intro({ files }: { files: number }) {
  const ms = (n: number) => `${n}ms`;
  const desk = { full: fullTimeline({ phone: false, files }), short: shortTimeline({ phone: false }) };
  const phone = { full: fullTimeline({ phone: true, files }), short: shortTimeline({ phone: true }) };
  const vars = (t: typeof desk) =>
    `--draw:${ms(t.full.draw)};--fade:${ms(t.short.fade)};--fade-at:${ms(t.short.fadeAt)};--short-flash:${ms(t.short.flash)};`;
  const flash = {
    "--fx": `calc(var(--cb-x) + ${FLASH_FROM[0]} * var(--cb-s))`,
    "--fy": `calc(var(--cb-y) + ${FLASH_FROM[1]} * var(--cb-s))`,
  } as CSSProperties;

  return (
    <>
      <style>{`.${s.overlay}{${vars(phone)}}@media ${DESKTOP_MEDIA}{.${s.overlay}{${vars(desk)}}}`}</style>
      <IntroDirector files={files} overlayClass={s.overlay} barClass={s.bar} lineClass={s.line} centerClass={s.center}>
        <span className={s.logo}>
          <Logo variant="outline" className={s.stroke} />
          <Logo variant="solid" className={s.fill} />
        </span>
      </IntroDirector>
      <div className={s.flash} style={flash} data-intro-flash="" aria-hidden="true" />
    </>
  );
}
