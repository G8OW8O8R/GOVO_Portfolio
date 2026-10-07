import { aboutSchema } from "./schema";

/** „O mnie” tab. PL 1:1 from design/content-about.md, EN translated. */
export const about = aboutSchema.parse({
  name: "Piotr Goworek",
  role: { pl: "Frontend developer · GOVO DIGITAL", en: "Frontend developer · GOVO DIGITAL" },
  facts: [
    { pl: "Polska", en: "Poland" },
    { pl: "Zdalnie lub hybrydowo", en: "Remote or hybrid" },
    { pl: "PL / EN", en: "PL / EN" },
  ],
  lead: {
    pl: "Buduję strony, które się zapamiętuje – szybkie, dopracowane i takie, które naprawdę działają.",
    en: "I build websites people remember – fast, polished and ones that actually work.",
  },
  text: [
    {
      pl: "Zajmuję się frontendem: projektuję interfejsy i sam je koduję, od pierwszej makiety po wdrożenie. Najbardziej lubię miejsce, w którym design spotyka się z techniką – ruch, który prowadzi użytkownika, grafikę w czasie rzeczywistym i dane, które aktualizują się na żywo.",
      en: "I work on the frontend: I design interfaces and code them myself, from the first mockup to deployment. What I enjoy most is the point where design meets engineering – motion that guides the user, real-time graphics and data that updates live.",
    },
    {
      pl: "Pod marką GOVO DIGITAL tworzę strony dla firm i projekty, w których sprawdzam, jak daleko można posunąć zwykłą stronę internetową. Pracuję w React, Next.js i TypeScript, a tam, gdzie projekt tego potrzebuje, sam przygotowuję wizualia – od makiet po grafikę i wideo.",
      en: "Under the GOVO DIGITAL brand I build websites for businesses and projects in which I test how far an ordinary website can go. I work with React, Next.js and TypeScript, and where a project needs it, I prepare the visuals myself – from mockups to graphics and video.",
    },
    {
      pl: "Dbam o rzeczy, których nie widać na pierwszy rzut oka: wydajność, dostępność, SEO i to, żeby strona nie przestała działać, gdy zawiedzie zewnętrzna usługa.",
      en: "I take care of the things you don't see at first glance: performance, accessibility, SEO, and making sure the site keeps working when an external service fails.",
    },
  ],
  seeking: {
    label: { pl: "Czego szukam", en: "What I'm looking for" },
    // "Dostępny od zaraz" from the facts, next to the green dot
    status: { pl: "Dostępny od zaraz", en: "Available now" },
    // shown as a large sentence, the rest below it (one sentence of the source split in two)
    strong: { pl: "Szukam pracy jako frontend developer.", en: "I'm looking for a job as a frontend developer." },
    rest: {
      pl: "Jestem otwarty na etat, B2B i stałą współpracę, zdalnie lub hybrydowo. Mogę zacząć od zaraz. Przyjmuję też zlecenia na strony dla firm.",
      en: "I'm open to full-time employment, B2B and long-term collaboration, remote or hybrid. I can start right away. I also take on website projects for businesses.",
    },
  },
  howIWork: {
    label: { pl: "Jak pracuję", en: "How I work" },
    points: [
      {
        title: { pl: "Od pomysłu do wdrożenia", en: "From idea to deployment" },
        text: { pl: "projekt, kod i publikacja w jednych rękach.", en: "design, code and launch in one pair of hands." },
      },
      {
        title: { pl: "Konkret zamiast obietnic", en: "Results, not promises" },
        text: { pl: "pokazuję działające wersje, nie tylko makiety.", en: "I show working versions, not just mockups." },
      },
      {
        title: { pl: "Szczegóły mają znaczenie", en: "Details matter" },
        text: {
          pl: "60 fps, dobry kontrast i szybkie ładowanie to część projektu, nie dodatek.",
          en: "60 fps, good contrast and fast loading are part of the project, not an extra.",
        },
      },
    ],
  },
  closing: {
    pl: "Masz projekt albo miejsce w zespole? Napisz – odpowiadam zwykle w ciągu doby.",
    en: "Have a project or a place on your team? Write to me – I usually reply within a day.",
  },
});
