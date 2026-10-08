import type { ProjectInput } from "../schema";

const obok: ProjectInput = {
  slug: "obok",
  order: 1,
  year: 2026,
  isNew: true,
  title: { pl: "Obok", en: "Obok" },
  // Draft – final copy comes with the case study (task 4).
  summary: {
    pl: "Strona z doświadczeniem: wideo, ruch i interakcje.",
    en: "An experience website: video, motion and interactions.",
  },
  icon: "/projects/obok/icon.png",
  // design/content-cv.md
  cv: {
    summary: {
      pl: "Interaktywny pulpit z żywym światem zależnym od prawdziwej pogody. Dane na żywo z kilku API (pogoda, kursy walut i kryptowalut, wiadomości, muzyka) z cache i zapasowymi źródłami, aplikacje w oknach, Spotlight z szybkimi poleceniami, wideo i ruch dopracowane pod 60 fps.",
      en: "An interactive desktop with a living world driven by the real weather. Live data from several APIs (weather, currency and crypto rates, news, music) with caching and fallback sources, apps in windows, Spotlight with quick commands, video and motion tuned for 60 fps.",
    },
    tags: ["Next.js", "TypeScript", "WebGL", "REST", "Zod", "Vercel"],
  },
};

export default obok;
