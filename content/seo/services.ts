import { serviceIds, type ServiceId } from "@/lib/routes";
import { servicePageSchema, type ServicePage } from "./schema";

const t = (pl: string, en = pl) => ({ pl, en });

/**
 * Service pages (/pl/uslugi/<slug>, /en/services/<slug>). PL is the source
 * copy, EN translated. Prices and times come from pricing.ts through
 * `packages`; the examples in `fit` are kinds of clients, not past clients.
 */
const pages = [
  {
    id: "strony-internetowe",
    name: t("Strony internetowe", "Websites"),
    title: t("Strony internetowe dla firm", "Websites for businesses"),
    description: t(
      "Strony internetowe dla firm {price}: wizytówka (czas realizacji {time}) albo pełna strona firmowa z podstronami. Szybkie na telefonie i gotowe na Google.",
      "Websites for businesses {price}: a one-page site (timeline: {time}) or a full company website with subpages. Fast on phones and ready for Google.",
    ),
    h1: t("Strony internetowe dla firm", "Websites for businesses"),
    lead: t(
      "Strona, z której klient w kilka sekund dowie się, czym się zajmujesz i jak się z Tobą skontaktować. Zaczynasz od wizytówki albo od razu od pełnej strony z podstronami.",
      "A website where a client learns in seconds what you do and how to reach you. Start with a one-page site or go straight for a full website with subpages.",
    ),
    packages: ["wizytowka", "strona-firmowa"],
    includes: [
      {
        title: t("Projekt pod Twoją markę", "Designed for your brand"),
        text: t(
          "Bez gotowego szablonu. Układ, grafiki i ruch dopasowuję do tego, czym się zajmujesz.",
          "No ready-made template. The layout, graphics and motion follow what your business does.",
        ),
      },
      {
        title: t("Najpierw telefon", "Phone first"),
        text: t(
          "Większość klientów wejdzie z telefonu, więc od niego zaczynam projekt.",
          "Most of your clients will arrive on a phone, so that's where the design starts.",
        ),
      },
      {
        title: t("Kontakt tam, gdzie się go szuka", "Contact where people look for it"),
        text: t(
          "Formularz, mapa, telefon i linki do social mediów w widocznym miejscu, bez szukania.",
          "A form, a map, your phone number and social links in plain sight, no hunting around.",
        ),
      },
      {
        title: t("Gotowa na Google", "Ready for Google"),
        text: t(
          "Tytuły, opisy, dane strukturalne i Google Search Console ustawiam przed publikacją.",
          "Titles, descriptions, structured data and Google Search Console are set up before launch.",
        ),
      },
      {
        title: t("Treści zmienisz sam", "Edit the content yourself"),
        text: t(
          "W stronie firmowej dostajesz prosty sposób na zmianę tekstów i zdjęć, bez dzwonienia do programisty.",
          "A company website comes with an easy way to change text and photos without calling a developer.",
        ),
      },
    ],
    focus: {
      title: t("Wizytówka czy strona firmowa?", "One-pager or company website?"),
      text: t(
        "Wizytówka to jedna strona: kim jesteś, co robisz i jak się skontaktować. Wystarczy, gdy klienci przychodzą z polecenia i chcą Cię tylko sprawdzić. Stronę firmową wybierz, gdy masz kilka usług i każda ma być osobno do znalezienia w Google. Wizytówkę można później rozbudować.",
        "A one-pager says who you are, what you do and how to get in touch. It's enough when clients come by referral and just want to check you out. Choose a company website when you offer several services and each should be found on Google on its own. A one-pager can be expanded later.",
      ),
    },
    fit: [
      t("gabinetu fizjoterapii, który chce przyjmować zapisy przez formularz", "a physiotherapy practice that wants to take bookings through a form"),
      t("firmy remontowej, która pokazuje realizacje i zbiera zapytania o wycenę", "a renovation company that shows its work and collects quote requests"),
      t("biura rachunkowego, w którym każda usługa ma własną podstronę", "an accounting office where every service has its own page"),
    ],
    related: ["landing-page", "redesign"],
    cta: t("Napisz, czym się zajmujesz. Odpiszę z zakresem i wyceną.", "Tell me what you do. I'll reply with a scope and a quote."),
  },
  {
    id: "landing-page",
    name: t("Landing page"),
    title: t("Landing page pod kampanię lub produkt", "Landing page for a campaign or product"),
    description: t(
      "Landing page {price}. Jedna strona pod jedną kampanię: projekt pod cel, animacje przy przewijaniu i zdarzenia konwersji w analityce. Czas realizacji: {time}.",
      "A landing page {price}. One page for one campaign: designed around the goal, with scroll animations and conversion events in analytics. Timeline: {time}.",
    ),
    h1: t("Landing page, który prowadzi do jednego celu", "A landing page built around one goal"),
    lead: t(
      "Jedna strona pod jedną kampanię lub produkt. Każda sekcja prowadzi do jednego działania: zapisu, zakupu albo kontaktu.",
      "One page for one campaign or product. Every section leads to a single action: a sign-up, a purchase or a message.",
    ),
    packages: ["landing-page"],
    includes: [
      {
        title: t("Projekt pod cel", "Designed around the goal"),
        text: t(
          "Zaczynamy od tego, co odwiedzający ma zrobić. Z tego wynika kolejność sekcji i treść przycisków.",
          "We start from what the visitor should do. The order of the sections and the wording of the buttons follow from that.",
        ),
      },
      {
        title: t("Animacje przy przewijaniu", "Scroll animations"),
        text: t(
          "Ruch prowadzi wzrok do kolejnej sekcji i do przycisku, zamiast rozpraszać.",
          "Motion guides the eye to the next section and to the button instead of distracting from it.",
        ),
      },
      {
        title: t("Analityka i konwersje", "Analytics and conversions"),
        text: t(
          "Zdarzenia konwersji podpięte do analityki: wiesz, ile osób się zapisało i skąd przyszły.",
          "Conversion events wired into analytics: you know how many people signed up and where they came from.",
        ),
      },
      {
        title: t("Szybkie ładowanie", "Fast loading"),
        text: t(
          "Za każde kliknięcie w reklamę płacisz, więc strona musi otworzyć się od razu, także na telefonie.",
          "You pay for every ad click, so the page has to open right away, on a phone too.",
        ),
      },
    ],
    focus: {
      title: t("Jeden cel na stronę", "One goal per page"),
      text: t(
        "Landing page bez menu i bez pięciu różnych przycisków działa lepiej niż zwykła podstrona. Gdy kampanie są dwie, robię dwa landingi pod osobnymi adresami. Wtedy w analityce od razu widać, która działa.",
        "A landing page without a menu and five different buttons works better than an ordinary subpage. With two campaigns I make two landing pages at separate addresses, so analytics shows straight away which one works.",
      ),
    },
    fit: [
      t("twórcy kursu online, który przed premierą zbiera listę oczekujących", "an online course creator building a waitlist before launch"),
      t("aplikacji, która przed startem sprawdza zainteresowanie zapisami", "an app testing interest with sign-ups before it launches"),
      t("firmy szkoleniowej, która promuje jedno wydarzenie z reklam", "a training company promoting a single event with ads"),
    ],
    related: ["strony-internetowe", "projekt-specjalny"],
    cta: t("Masz kampanię albo produkt na start? Napisz, na kiedy potrzebujesz strony.", "Got a campaign or a product to launch? Tell me when you need the page."),
  },
  {
    id: "sklep-internetowy",
    name: t("Sklep internetowy", "Online shop"),
    title: t("Sklep internetowy, w którym łatwo kupić", "An online shop where buying is easy"),
    description: t(
      "Sklep internetowy {price}. Katalog, koszyk, płatności online i wysyłki skonfigurowane za Ciebie, karty produktów pod SEO i szkolenie z obsługi. Czas realizacji: {time}.",
      "An online shop {price}. Catalogue, cart, online payments and shipping set up for you, SEO-ready product pages and training on running it. Timeline: {time}.",
    ),
    h1: t("Sklep internetowy, w którym łatwo kupić", "An online shop where buying is easy"),
    lead: t(
      "Produkt znajdziesz szybko, a zapłacisz w kilka kliknięć. Płatności online i wysyłki konfiguruję za Ciebie, a na koniec pokazuję, jak prowadzić sklep samodzielnie.",
      "People find a product quickly and pay in a few clicks. I set up online payments and shipping for you, and at the end I show you how to run the shop yourself.",
    ),
    packages: ["sklep-internetowy"],
    includes: [
      {
        title: t("Katalog i koszyk", "Catalogue and cart"),
        text: t(
          "Kategorie, wyszukiwarka i koszyk, z których wygodnie korzysta się na telefonie.",
          "Categories, search and a cart that are comfortable to use on a phone.",
        ),
      },
      {
        title: t("Płatności online", "Online payments"),
        text: t(
          "Operatora płatności wybieramy razem, a konfiguruję go ja.",
          "We choose the payment provider together and I set it up.",
        ),
      },
      {
        title: t("Wysyłki", "Shipping"),
        text: t(
          "Metody dostawy z kosztem widocznym, zanim klient przejdzie do płatności.",
          "Delivery options with the cost shown before the customer gets to payment.",
        ),
      },
      {
        title: t("Karty produktów pod SEO", "SEO-ready product pages"),
        text: t(
          "Każdy produkt ma własny adres, opis i dane strukturalne, więc może pojawić się w Google.",
          "Every product has its own address, description and structured data, so it can show up on Google.",
        ),
      },
      {
        title: t("Szkolenie z obsługi", "Training"),
        text: t(
          "Pokazuję, jak dodać produkt, zmienić cenę i obsłużyć zamówienie.",
          "I show you how to add a product, change a price and handle an order.",
        ),
      },
    ],
    focus: {
      title: t("Płatności i wysyłki", "Payments and shipping"),
      text: t(
        "Tu sklepy najczęściej tracą klientów: zaskakujący koszt dostawy, za długi formularz, brak wygodnej płatności. Koszt dostawy pokazuję wcześnie, formularz skracam do niezbędnych pól, a płatności testujemy razem przed startem.",
        "This is where shops lose most customers: a surprising delivery cost, a form that's too long, no convenient way to pay. I show the delivery cost early, cut the form down to the fields that matter, and we test payments together before launch.",
      ),
    },
    fit: [
      t("małej palarni kawy, która sprzedaje ziarno w subskrypcji", "a small coffee roastery selling beans on subscription"),
      t("pracowni ceramiki, która sprzedaje krótkie serie", "a ceramics studio selling short runs"),
      t("sklepu stacjonarnego, który chce sprzedawać też online", "a bricks-and-mortar shop that wants to sell online too"),
    ],
    related: ["strony-internetowe", "redesign"],
    cta: t("Opisz, co sprzedajesz i ile masz produktów. Odpiszę z planem sklepu i wyceną.", "Tell me what you sell and how many products you have. I'll reply with a plan and a quote."),
  },
  {
    id: "redesign",
    name: t("Redesign"),
    title: t("Redesign strony bez utraty pozycji w Google", "Website redesign that keeps your rankings"),
    description: t(
      "Redesign strony {price}. Audyt, nowy projekt i kod oraz przekierowania 301 ze starych adresów: strona jest szybsza, a pozycje w Google zostają.",
      "A website redesign {price}. An audit, new design and code, and 301 redirects from the old addresses: the site gets faster and keeps its Google rankings.",
    ),
    h1: t("Redesign strony bez utraty pozycji w Google", "A website redesign that keeps your Google rankings"),
    lead: t(
      "Nowy wygląd i szybkość dla strony, która już działa. Zanim cokolwiek zmienię, sprawdzam, co dziś przyprowadza klientów, żeby tego nie zgubić.",
      "A new look and speed for a website that already works. Before I change anything, I check what brings clients in today so none of it gets lost.",
    ),
    packages: ["redesign"],
    includes: [
      {
        title: t("Audyt obecnej strony", "Audit of the current site"),
        text: t(
          "Szybkość, wersja na telefon, adresy i frazy, z których przychodzą odwiedzający.",
          "Speed, the phone version, and the addresses and search phrases visitors come from.",
        ),
      },
      {
        title: t("Nowy projekt i kod", "New design and code"),
        text: t("Od podstaw, bez łatania starego szablonu.", "Built from scratch, not a patched-up old template."),
      },
      {
        title: t("Przekierowania 301", "301 redirects"),
        text: t(
          "Każdy stary adres prowadzi do właściwej nowej strony, a nie na stronę główną.",
          "Every old address leads to the right new page, not to the home page.",
        ),
      },
      {
        title: t("Sprawdzenie po starcie", "Checks after launch"),
        text: t(
          "Po publikacji sprawdzam w Google Search Console, czy nowe adresy są indeksowane.",
          "After launch I check in Google Search Console that the new addresses are being indexed.",
        ),
      },
    ],
    focus: {
      title: t("Co z pozycjami w Google?", "What happens to my rankings?"),
      text: t(
        "Pozycje giną zwykle wtedy, gdy znikają stare adresy. Dlatego najpierw spisuję wszystkie adresy starej strony i każdy przekierowuję 301 na jego odpowiednik. Tak przeniosłem też tę stronę: adresy usług zostały, a reszta prowadzi do nowych miejsc.",
        "Rankings usually disappear when the old addresses do. So first I list every address of the old site and point each one to its counterpart with a 301. That's how I moved this website too: the service addresses stayed, and the rest lead to their new places.",
      ),
    },
    fit: [
      t("biura rachunkowego ze stroną sprzed lat, która nie działa na telefonie", "an accounting office with a years-old website that doesn't work on phones"),
      t("restauracji, której menu wisi w PDF-ie nieczytelnym na telefonie", "a restaurant whose menu is a PDF nobody can read on a phone"),
      t("firmy, której strona ładuje się kilka sekund i traci klientów z reklam", "a business whose site takes seconds to load and loses visitors from ads"),
    ],
    related: ["strony-internetowe", "sklep-internetowy"],
    cta: t("Wyślij adres swojej strony. Odpiszę, co bym zmienił i ile to kosztuje.", "Send me your website's address. I'll reply with what I'd change and what it costs."),
  },
  {
    id: "projekt-specjalny",
    name: t("Projekt specjalny", "Special project"),
    title: t("Interaktywna strona z WebGL i wideo", "Interactive website with WebGL and video"),
    description: t(
      "Projekt specjalny {price}: strona, która jest wydarzeniem. Koncept i art direction, własne grafiki i wideo, ruch, interakcje i WebGL, a mimo to szybkie ładowanie.",
      "A special project {price}: a website that is an event. Concept and art direction, custom graphics and video, motion, interactions and WebGL, and still fast to load.",
    ),
    h1: t("Projekt specjalny: strona, która jest wydarzeniem", "Special project: a website that is an event"),
    lead: t(
      "Interaktywny świat, wideo i grafika w czasie rzeczywistym. Dla marek, które chcą, żeby stronę się pamiętało, a nie tylko przeglądało.",
      "An interactive world, video and real-time graphics. For brands that want their website remembered, not just browsed.",
    ),
    packages: ["projekt-specjalny"],
    includes: [
      {
        title: t("Koncept i art direction", "Concept and art direction"),
        text: t("Zaczynamy od pomysłu na doświadczenie, a nie od listy sekcji.", "We start from an idea for the experience, not from a list of sections."),
      },
      {
        title: t("Własne grafiki i wideo", "Custom graphics and video"),
        text: t("Sceny, tekstury i nagrania przygotowane pod tę jedną stronę.", "Scenes, textures and footage made for this one website."),
      },
      {
        title: t("Ruch, interakcje, WebGL", "Motion, interactions, WebGL"),
        text: t(
          "Strona reaguje na kursor, przewijanie i dotyk. Grafikę w czasie rzeczywistym piszę bez ciężkich bibliotek, gdy da się bez nich.",
          "The site responds to the cursor, scrolling and touch. I write real-time graphics without heavy libraries whenever that's possible.",
        ),
      },
      {
        title: t("Wydajność i dostępność", "Performance and accessibility"),
        text: t(
          "Efekty nie mogą zatrzymać telefonu. Kto wyłączył animacje w systemie, dostaje spokojną wersję strony.",
          "The effects must not stall a phone. Anyone who turned off animations in their system gets a calm version of the site.",
        ),
      },
    ],
    focus: {
      title: t("Od pomysłu do premiery", "From idea to launch"),
      text: t(
        "Projekt specjalny wyceniam po rozmowie, bo zakres zależy od pomysłu. Najpierw ustalamy jedno doświadczenie, które ma zostać w głowie, potem powstają grafiki i ruch. Działające wersje widzisz po drodze, nie dopiero na końcu.",
        "I quote a special project after a conversation, because the scope depends on the idea. First we agree on the one experience people should remember, then the graphics and motion follow. You see working versions along the way, not only at the end.",
      ),
    },
    proof: {
      project: "obok",
      text: t(
        "Obok to pulpit nad żywym krajobrazem latarni, który zmienia się z prawdziwą pogodą i porą dnia. Projekt, sceny, wideo i kod zrobiłem sam.",
        "Obok is a desktop over a living lighthouse landscape that changes with the real weather and time of day. I made the design, the scenes, the video and the code myself.",
      ),
    },
    fit: [
      t("marki, która wprowadza produkt i chce, żeby o premierze się mówiło", "a brand launching a product that wants people to talk about it"),
      t("studia lub artysty, dla którego strona jest częścią portfolio", "a studio or artist whose website is part of the portfolio"),
      t("wydarzenia z własnym światem wizualnym", "an event with a visual world of its own"),
    ],
    related: ["landing-page", "strony-internetowe"],
    cta: t("Masz pomysł, który nie mieści się w szablonie? Opowiedz o nim.", "Have an idea that doesn't fit a template? Tell me about it."),
  },
] satisfies (Omit<ServicePage, "id"> & { id: ServiceId })[];

export const servicePages: readonly ServicePage[] = pages.map((page) => servicePageSchema.parse(page));

// every service address (lib/routes.ts) has its page
for (const id of serviceIds) {
  if (!servicePages.some((page) => page.id === id)) throw new Error(`No service page for "${id}"`);
}

export function getServicePage(id: string): ServicePage | undefined {
  return servicePages.find((page) => page.id === id);
}

/** The service page that sells a pricing package (pricing rows link to it). */
export function serviceForPackage(packageId: string): ServicePage | undefined {
  return servicePages.find((page) => page.packages.includes(packageId));
}
