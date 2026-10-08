import { offerSchema } from "./schema";

const t = (pl: string, en = pl) => ({ pl, en });

/**
 * Services and Process tabs of the Offer window (text approved by the owner).
 * Services describe what I do; prices live only in pricing.ts (Pricing tab).
 * The examples are kinds of clients a service fits, not past clients.
 */
export const offer = offerSchema.parse({
  servicesTitle: t("Co robię", "What I do"),
  servicesLead: t(
    "Strony dla firm i marek – od prostej wizytówki po stronę, którą się zapamiętuje.",
    "Websites for businesses and brands – from a simple business card site to a website people remember.",
  ),
  services: [
    {
      id: "strony-firmowe",
      thumb: "firmowe",
      title: t("Strony firmowe i wizytówki", "Business websites and one-pagers"),
      text: t(
        "Strona, z której klient w kilka sekund dowie się, czym się zajmujesz i jak się z Tobą skontaktować. Działa szybko na telefonie i od startu jest gotowa na Google.",
        "A website where a client learns in seconds what you do and how to reach you. It's fast on a phone and ready for Google from day one.",
      ),
      fit: t(
        "Sprawdzi się np. dla gabinetu fizjoterapii, który chce przyjmować zapisy przez formularz.",
        "A good fit for, e.g., a physiotherapy practice that wants to take bookings through a form.",
      ),
    },
    {
      id: "landing-page",
      thumb: "landing",
      title: t("Landing page"),
      text: t(
        "Jedna strona pod jedną kampanię lub produkt. Każda sekcja prowadzi do jednego działania, na przykład zapisu na listę.",
        "One page for one campaign or product. Every section leads to a single action, such as joining a list.",
      ),
      fit: t(
        "Sprawdzi się np. dla twórcy kursu online, który przed premierą zbiera listę oczekujących.",
        "A good fit for, e.g., an online course creator building a waitlist before launch.",
      ),
    },
    {
      id: "sklepy",
      thumb: "sklep",
      title: t("Sklepy internetowe", "Online shops"),
      text: t(
        "Sklep, w którym produkt znajdziesz szybko, a zapłacisz w kilka kliknięć. Płatności online i wysyłki konfiguruję za Ciebie.",
        "A shop where people find a product quickly and pay in a few clicks. I set up online payments and shipping for you.",
      ),
      fit: t(
        "Sprawdzi się np. dla małej palarni kawy, która sprzedaje ziarno w subskrypcji.",
        "A good fit for, e.g., a small coffee roastery selling beans on subscription.",
      ),
    },
    {
      id: "redesign",
      thumb: "redesign",
      title: t("Redesign"),
      text: t(
        "Nowy wygląd i szybkość dla strony, która już działa. Stare adresy przekierowuję na nowe, więc pozycje w Google zostają.",
        "A new look and speed for a website that already works. I redirect the old addresses to the new ones, so your Google rankings stay.",
      ),
      fit: t(
        "Sprawdzi się np. dla biura rachunkowego ze stroną sprzed lat, która nie działa na telefonie.",
        "A good fit for, e.g., an accounting office with a years-old website that doesn't work on phones.",
      ),
    },
  ],
  processTitle: t("Od rozmowy do publikacji", "From first call to launch"),
  process: [
    {
      title: t("Rozmowa i wycena", "Conversation and quote"),
      text: t(
        "Krótka rozmowa o celu i zakresie. Dokładną wycenę dostajesz zwykle w ciągu doby.",
        "A short conversation about the goal and scope. You usually get an exact quote within a day.",
      ),
    },
    {
      title: t("Treści i zdjęcia", "Copy and photos"),
      text: t(
        "Zbieramy teksty i zdjęcia; jeśli ich nie masz, pomogę je przygotować. Od tego momentu liczę czas realizacji.",
        "We gather the copy and photos; if you don't have them, I'll help you prepare them. The timeline starts from this point.",
      ),
    },
    {
      title: t("Projekt i kod", "Design and code"),
      text: t(
        "Widzisz postęp na bieżąco, nie dopiero na końcu – pokazuję działające wersje, nie tylko makiety.",
        "You see progress as it happens, not only at the end – I show working versions, not just mockups.",
      ),
    },
    {
      title: t("Poprawki", "Revisions"),
      text: t(
        "Poprawki są w cenie. Dopracowujemy szczegóły, aż strona będzie gotowa do publikacji.",
        "Revisions are included. We refine the details until the website is ready to go live.",
      ),
    },
    {
      title: t("Wdrożenie", "Launch"),
      text: t(
        "Publikuję stronę i pomagam wybrać i skonfigurować domenę i hosting. Przy redesignie: przekierowania 301 ze starych adresów.",
        "I publish the website and help you choose and set up the domain and hosting. For a redesign: 301 redirects from the old addresses.",
      ),
    },
    {
      title: t("Opieka (opcjonalnie)", "Care (optional)"),
      text: t(
        "Aktualizacje, kopie zapasowe, drobne zmiany treści i monitoring działania.",
        "Updates, backups, small content changes and uptime monitoring.",
      ),
    },
  ],
});
