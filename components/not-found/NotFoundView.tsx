import { getDictionary } from "@/content/dictionaries";
import { CharacterPoster } from "@/components/character/Character";
import { Logo } from "@/components/ui/Logo";
import { characterBoxCss } from "@/lib/character-box";
import { locales, type Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import s from "./not-found.module.css";

/**
 * "No such file": the desktop's backdrop, logo and character (the poster, no
 * WebGL) with one small window. Plain links, no client code, so it is the same
 * with or without JavaScript. Both languages: the global 404 page doesn't know
 * which one the visitor came from, so the other language sits under the first.
 */
export function NotFoundView({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const L = dict.notFound;
  const other = locales.filter((l) => l !== lang).map((l) => ({ lang: l, text: getDictionary(l).notFound }));
  const home = href(lang, "home");

  return (
    <div className={s.root}>
      <style>{characterBoxCss(":root")}</style>
      <a href={home} className={s.logo} aria-label={dict.desktop.homeLabel}>
        <Logo className="block h-full" variant="solid" />
      </a>
      <div className={s.stage} aria-hidden="true">
        <CharacterPoster alt="" />
      </div>

      <main className={s.window} aria-labelledby="not-found-title">
        <div className={s.bar}>
          <p className={s.file}>{L.file}</p>
          <a href={home} className={s.close} aria-label={L.close}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </a>
        </div>
        <div className={s.body}>
          <p className={s.code}>404</p>
          <h1 id="not-found-title" className={s.title}>
            {L.title}
          </h1>
          <p className={s.text}>{L.text}</p>
          <a href={home} className={s.primary}>
            {L.back}
          </a>
          {other.map((o) => (
            <p key={o.lang} lang={o.lang} className={s.other}>
              {o.text.title}.{" "}
              <a href={href(o.lang, "home")} className={s.link}>
                {o.text.back} →
              </a>
            </p>
          ))}
        </div>
      </main>
    </div>
  );
}
