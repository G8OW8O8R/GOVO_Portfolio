import { localIds, type LocalId } from "@/lib/routes";
import { localPageSchema, type LocalPage } from "./schema";

const t = (pl: string, en = pl) => ({ pl, en });

/**
 * Local pages (/pl/strony-internetowe-warszawa, /en/web-design-warsaw).
 * Each one written for its city, never another city's copy with the name
 * swapped. The English page speaks to international companies and
 * expats in the city, it is not a translation. No clients, reviews or
 * office address: there are none to show.
 */
const pages = [
  {
    id: "warszawa",
    name: t("Warszawa", "Warsaw"),
    city: t("Warszawa", "Warsaw"),
    title: t("Strony internetowe Warszawa", "Web design in Warsaw"),
    description: t(
      "Strony internetowe dla firm z Warszawy {price}: usługi lokalne, gastronomia, biura. Pracuję zdalnie, a jeśli wolisz, spotkamy się na żywo. Wizytówka: {time}.",
      "Websites for companies and expats in Warsaw {price}, in English, Polish or both. I work remotely, and we can meet in person if you prefer. Fast and mobile-first.",
    ),
    h1: t("Strony internetowe dla firm z Warszawy", "Web design for companies in Warsaw"),
    lead: t(
      "W Warszawie klient porównuje kilka firm z tej samej okolicy, zanim zadzwoni. Robię strony, które w tym porównaniu dobrze wypadają: szybkie na telefonie, z jasną ofertą i kontaktem na wierzchu.",
      "Running a business in Warsaw often means two audiences: Polish clients and international ones. I build websites that work for both, fast on a phone and clear about what you offer.",
    ),
    thumb: "/services/firmowe.png",
    audiencesTitle: t("Dla kogo w Warszawie", "Who it's for in Warsaw"),
    audiences: [
      {
        title: t("Usługi lokalne", "International companies"),
        text: t(
          "Gabinety, salony, warsztaty. Klient szuka z telefonu, często z dzielnicą w zapytaniu, i chce od razu zadzwonić albo się zapisać. Usługi, ceny, godziny i dojazd są na stronie bez szukania.",
          "Offices and startups with clients on both sides of the border. A bilingual site where the English reads naturally and each language has its own addresses and titles, not a machine translation.",
        ),
      },
      {
        title: t("Gastronomia", "Expats running a business"),
        text: t(
          "Restauracje, kawiarnie, piekarnie. Menu czytelne na telefonie zamiast PDF-u, godziny otwarcia na wierzchu, rezerwacja albo telefon jednym dotknięciem. Zmiana w menu nie wymaga nowej grafiki.",
          "Clinics, language schools, studios. Your clients search in English, so the site starts in English, with Polish alongside for local customers, and booking or a phone call one tap away.",
        ),
      },
      {
        title: t("Biura i kancelarie", "Restaurants and cafés"),
        text: t(
          "Rachunkowość, prawo, doradztwo. Każda specjalizacja na osobnej podstronie, którą łatwo podesłać klientowi, a w razie potrzeby wersja po angielsku dla klientów z zagranicy.",
          "A menu that reads well on a phone in Polish and English instead of a PDF, opening hours in plain sight, and a reservation or a call one tap away.",
        ),
      },
    ],
    packages: [
      { id: "wizytowka", service: "strony-internetowe" },
      { id: "strona-firmowa", service: "strony-internetowe" },
      { id: "landing-page", service: "landing-page" },
    ],
    proof: t(
      "Jak wygląda moja praca od środka, pokazuję w case study Obok: od pomysłu i scen po kod i pomiary.",
      "The Obok case study shows how I work from the inside: from the idea and the scenes to the code and the measurements.",
    ),
    faq: [
      {
        q: t("Czy musimy się spotkać?", "Do we need to meet in person?"),
        a: t(
          "Nie. Większość projektów prowadzę zdalnie i dla obu stron to zwykle szybsze. Jeśli wolisz rozmowę przy stole, w Warszawie i okolicach możemy się spotkać.",
          "No. I run most projects remotely, which is usually quicker for both of us. If you'd rather talk face to face, we can meet in or around Warsaw.",
        ),
      },
      {
        q: t("Pomożesz z Profilem Firmy w Google?", "Can you help with my Google Business Profile?"),
        a: t(
          "Tak, pomogę go założyć i uzupełnić, a nazwę, adres i godziny na stronie ustawię tak samo jak w profilu. Miejsca w Mapach Google nie obiecuję, bo zależy ono także od rzeczy poza stroną.",
          "Yes, I'll help you set it up and fill it in, and the name, address and hours on the site will match the profile. I don't promise a place on Google Maps, because it also depends on things outside the website.",
        ),
      },
      {
        q: t("Czy strona może być po polsku i po angielsku?", "Do you work in English?"),
        a: t(
          "Tak. Strona firmowa może mieć wersję PL i EN, każda z własnymi adresami i tytułami. Koszt drugiego języka podaję w wycenie.",
          "Yes. We can talk, write and run the whole project in English, and the site can be in English, Polish or both, each language with its own addresses and titles.",
        ),
      },
    ],
    cta: t(
      "Napisz, czym zajmuje się Twoja firma. Jeśli wolisz, umówimy się na rozmowę w Warszawie.",
      "Tell me about your business. If you prefer, we can meet in Warsaw.",
    ),
  },
] satisfies (Omit<LocalPage, "id"> & { id: LocalId })[];

export const localPages: readonly LocalPage[] = pages.map((page) => localPageSchema.parse(page));

// every local address (lib/routes.ts) has its page
for (const id of localIds) {
  if (!localPages.some((page) => page.id === id)) throw new Error(`No local page for "${id}"`);
}

export function getLocalPage(id: string): LocalPage | undefined {
  return localPages.find((page) => page.id === id);
}
