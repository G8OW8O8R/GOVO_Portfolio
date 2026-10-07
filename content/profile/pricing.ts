import { pricingSchema } from "./schema";

const t = (pl: string, en = pl) => ({ pl, en });

/**
 * Pricing – the only source of prices on the site (Offer window, service
 * pages in task 4b, the assistant). PL 1:1 from design/content-pricing.md,
 * EN translated. Net prices in PLN, always "from".
 */
export const pricing = pricingSchema.parse({
  // the lead of design/content-pricing.md, its first sentence as the heading
  headline: t("Szybko i dobrze, nie długo i drogo.", "Fast and good, not slow and expensive."),
  lead: t(
    "Prostą stronę oddaję nawet w 2–3 dni robocze, a każdy projekt wyceniam indywidualnie – prostszy może kosztować mniej.",
    "I can deliver a simple website in as little as 2–3 working days, and I price every project individually – a simpler one may cost less.",
  ),
  perks: [
    t("Gotowe nawet w 2–3 dni robocze", "Ready in as little as 2–3 working days"),
    t("Widzisz postęp na bieżąco, nie dopiero na końcu", "You see progress as it happens, not only at the end"),
    t("Poprawki w cenie", "Revisions included"),
  ],
  // one sentence under the lead (task 5a), the link opens Contact with the budget preset
  smallBudget: {
    text: t(
      "Masz mniejszy budżet? Dopasuję zakres do kwoty, a stronę rozbudujesz później.",
      "Have a smaller budget? I'll fit the scope to the amount, and you can grow the site later.",
    ),
    cta: t("Napisz, ile chcesz wydać", "Tell me how much you want to spend"),
  },
  popularBadge: t("Najczęściej wybierany", "Most popular"),
  packages: [
    {
      id: "wizytowka",
      name: t("Wizytówka", "Business card site"),
      from: 990,
      description: t(
        "Jedna strona, która mówi, kim jesteś i jak się z Tobą skontaktować.",
        "One page that says who you are and how to get in touch.",
      ),
      features: [
        t("do 5 sekcji, wersja mobilna", "up to 5 sections, mobile version"),
        t("formularz kontaktowy, mapa, linki do social mediów", "contact form, map, social media links"),
        t("podstawowe SEO i Google Search Console", "basic SEO and Google Search Console"),
      ],
      time: t("już od 2–3 dni roboczych", "from just 2–3 working days"),
    },
    {
      id: "landing-page",
      name: t("Landing page"),
      from: 1490,
      description: t(
        "Strona pod jedną kampanię lub produkt, nastawiona na konwersję.",
        "A page for a single campaign or product, built to convert.",
      ),
      features: [
        t("projekt pod cel (zapis, zakup, kontakt)", "designed around the goal (sign-up, purchase, contact)"),
        t("animacje przy przewijaniu", "scroll animations"),
        t("analityka i zdarzenia konwersji", "analytics and conversion events"),
      ],
      time: t("od 3–5 dni roboczych", "from 3–5 working days"),
    },
    {
      id: "strona-firmowa",
      name: t("Strona firmowa", "Company website"),
      from: 2490,
      popular: true,
      description: t(
        "Pełna strona firmy z podstronami, gotowa na Google.",
        "A complete company website with subpages, ready for Google.",
      ),
      features: [
        t("do 8 podstron, wersja PL lub PL+EN (+ ok. 20%)", "up to 8 subpages, PL or PL+EN version (+ approx. 20%)"),
        t("SEO techniczne, dane strukturalne, szybkie ładowanie", "technical SEO, structured data, fast loading"),
        t("prosty sposób na zmianę treści", "an easy way to update the content"),
      ],
      time: t("ok. 1–2 tygodnie", "approx. 1–2 weeks"),
    },
    {
      id: "sklep-internetowy",
      name: t("Sklep internetowy", "Online shop"),
      from: 4990,
      description: t("Sklep, w którym łatwo kupić.", "A shop where buying is easy."),
      features: [
        t("katalog, koszyk, płatności online, wysyłki", "catalogue, cart, online payments, shipping"),
        t("karty produktów pod SEO", "SEO-ready product pages"),
        t("szkolenie z obsługi", "training on running the shop"),
      ],
      time: t("ok. 2–4 tygodnie", "approx. 2–4 weeks"),
    },
    {
      id: "redesign",
      name: t("Redesign"),
      from: 1790,
      description: t(
        "Nowy wygląd i szybkość dla istniejącej strony, bez utraty pozycji w Google.",
        "A new look and speed for an existing website, without losing your Google rankings.",
      ),
      features: [
        t("audyt obecnej strony", "audit of the current website"),
        t("nowy projekt i kod", "new design and code"),
        t("przekierowania 301 ze starych adresów", "301 redirects from the old addresses"),
      ],
      time: t("od 3–5 dni roboczych, zależnie od wielkości strony", "from 3–5 working days, depending on the size of the website"),
    },
  ],
  experience: {
    id: "strony-z-doswiadczeniem",
    name: t("Strony z doświadczeniem", "Experience websites"),
    from: 7900,
    description: t(
      "Dla marek, które chcą, żeby strona była wydarzeniem. Własne wizualia i wideo, animacje, interakcje i grafika w czasie rzeczywistym – strona, którą się zapamiętuje i udostępnia.",
      "For brands that want their website to be an event. Custom visuals and video, animations, interactions and real-time graphics – a website people remember and share.",
    ),
    features: [
      t("koncept i art direction", "concept and art direction"),
      t("własne grafiki i wideo przygotowane pod stronę", "custom graphics and video prepared for the website"),
      t("ruch, interakcje, WebGL", "motion, interactions, WebGL"),
      t("wydajność i dostępność mimo efektów", "performance and accessibility despite the effects"),
    ],
    proofLabel: t("Dowód:", "Proof:"),
    proofProject: "obok",
    cta: t("Porozmawiajmy o projekcie", "Let's talk about your project"),
  },
  care: {
    name: t("Opieka nad stroną", "Website care"),
    fromMonthly: 99,
    description: t(
      "Aktualizacje, kopie zapasowe, drobne zmiany treści i monitoring działania.",
      "Updates, backups, small content changes and uptime monitoring.",
    ),
  },
  footnote: t(
    "Ceny netto. Czas liczę od otrzymania treści i zdjęć – jeśli ich nie masz, pomogę je przygotować. Domena i hosting po stronie klienta – pomogę je wybrać i skonfigurować. Dokładna wycena po krótkiej rozmowie, zwykle w ciągu doby.",
    "Net prices. The timeline starts once I receive the copy and photos – if you don't have them, I'll help you prepare them. The domain and hosting are on the client's side – I'll help you choose and set them up. An exact quote after a short conversation, usually within a day.",
  ),
});
