import { workflowSchema } from "./schema";

const t = (pl: string, en = pl) => ({ pl, en });

/**
 * How I work with clients (service pages and the Warsaw page). Remote is
 * the default and the advantage, for clients from all of Poland and, in
 * English, from anywhere; a meeting in person is an option in Warsaw, never
 * a limit and never a promise of when.
 */
export const workflow = workflowSchema.parse({
  title: t("Jak pracuję", "How I work"),
  reach: t(
    "Pracuję zdalnie z klientami z całej Polski.",
    "I work remotely with clients worldwide – communication in English, CET time zone.",
  ),
  remote: t(
    "Zaczynamy od krótkiej rozmowy wideo, a potem postęp widzisz na bieżąco pod linkiem, bez dojazdów i straconego czasu.",
    "We start with a short video call, then you follow the progress at a link as it happens, with no travel and no time lost.",
  ),
  steps: [
    {
      title: t("Rozmowa wideo", "A video call"),
      text: t(
        "Krótko o celu, zakresie i terminie. Dokładną wycenę dostajesz zwykle w ciągu doby.",
        "A short talk about the goal, the scope and the deadline. You usually get an exact quote within a day.",
      ),
    },
    {
      title: t("Podgląd pod linkiem", "A preview at a link"),
      text: t(
        "Dostajesz adres działającej wersji strony i zaglądasz, kiedy chcesz, także z telefonu. Nie czekasz do końca, żeby coś zobaczyć.",
        "You get the address of a working version of the site and look whenever you like, on a phone too. No waiting until the end to see anything.",
      ),
    },
    {
      title: t("Uwagi i poprawki", "Feedback and changes"),
      text: t(
        "Uwagi piszesz wtedy, kiedy masz na to czas. Poprawki są w cenie.",
        "You send feedback whenever you have the time. Changes are included in the price.",
      ),
    },
    {
      title: t("Publikacja", "Launch"),
      text: t(
        "Publikuję stronę na Twojej domenie i sprawdzam, czy wszystko działa. Z domeną i hostingiem pomogę.",
        "I publish the site on your domain and check that everything works. I'll help with the domain and hosting.",
      ),
    },
  ],
  meet: t(
    "Jesteś z Warszawy lub okolic i wolisz porozmawiać przy stole? Możemy spotkać się na żywo.",
    "Based in or around Warsaw and prefer to talk face to face? We can meet in person.",
  ),
  beyond: t(
    "Poza Warszawą pracuję zdalnie z klientami z całej Polski i z zagranicy.",
    "Outside Warsaw I work remotely with clients across Poland and abroad.",
  ),
  quoteEur: "Clients outside Poland get a quote in EUR.",
});
