import { localIds, type LocalId } from "@/lib/routes";
import { localPageSchema, type LocalPage } from "./schema";

const t = (pl: string, en = pl) => ({ pl, en });

/**
 * Local pages (/pl/strony-internetowe-warszawa, /en/web-design-warsaw).
 * Each one written for its city, never another city's copy with the name
 * swapped. The English page speaks to international companies and
 * newcomers in the city, it is not a translation.
 */
const pages = [
  {
    id: "warszawa",
    name: t("Warszawa", "Warsaw"),
    city: t("Warszawa", "Warsaw"),
    title: t("Strony internetowe Warszawa", "Web design in Warsaw"),
    description: t(
      "Strony internetowe dla firm z Warszawy {price}. Spotkanie na żywo w Warszawie i okolicach, strona pod lokalne frazy i Profil Firmy w Google. Czas realizacji wizytówki: {time}.",
      "Websites for companies in Warsaw {price}, in English, Polish or both. We can meet in person in and around Warsaw. Fast, mobile-first and ready for Google.",
    ),
    h1: t("Strony internetowe dla firm z Warszawy", "Web design for companies in Warsaw"),
    lead: t(
      "W Warszawie klient porównuje kilka firm z jednej dzielnicy, zanim zadzwoni. Robię strony, które w tym porównaniu wygrywają: szybkie na telefonie, z jasną ofertą i kontaktem na wierzchu.",
      "Running a business in Warsaw often means two audiences: Polish clients and international ones. I build websites that work for both, fast on a phone and clear about what you offer.",
    ),
    meet: {
      title: t("Jak pracujemy", "How we work"),
      text: t(
        "W Warszawie i okolicach możemy spotkać się na żywo. Poza tym rozmawiamy przez wideo, a postępy widzisz online na bieżąco.",
        "In and around Warsaw we can meet in person. Otherwise we talk over video, and you follow the progress online as it happens.",
      ),
    },
    packages: [
      { id: "wizytowka", service: "strony-internetowe" },
      { id: "strona-firmowa", service: "strony-internetowe" },
      { id: "landing-page", service: "landing-page" },
    ],
    focus: {
      title: t("Lokalnie w Google", "Found locally on Google"),
      text: t(
        "Ludzie szukają z dzielnicą w zapytaniu: „fizjoterapeuta Mokotów”, „księgowa Wola”. Dlatego każda usługa dostaje własną podstronę z dzielnicą, w której działasz, a dane firmy na stronie zgadzają się z Profilem Firmy w Google. Pomogę też ten profil uzupełnić.",
        "People search in English too: “dentist Warsaw English speaking”, “accountant for expats Warsaw”. So the English version gets its own addresses and titles instead of a machine translation, and your details on the site match your Google Business Profile. I'll help you fill that in as well.",
      ),
    },
    fit: [
      t(
        "gabinetu na Mokotowie, który chce zapisów online zamiast telefonów w trakcie wizyt",
        "a clinic serving expats that needs a clear English page and online booking",
      ),
      t(
        "kancelarii ze Śródmieścia, w której każda specjalizacja ma własną podstronę",
        "a law or accounting firm in the city centre with a separate page for every specialism",
      ),
      t(
        "startupu, który przed spotkaniem z inwestorami potrzebuje landing page'a po polsku i angielsku",
        "a startup that needs a bilingual landing page before meeting investors",
      ),
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
