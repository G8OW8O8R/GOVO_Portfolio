import { serviceIds, type ServiceId } from "@/lib/routes";
import { servicePageSchema, type ServicePage } from "./schema";

const t = (pl: string, en = pl) => ({ pl, en });

/**
 * Service pages (/pl/uslugi/<slug>, /en/services/<slug>). PL is the source
 * copy, EN translated. Prices and times come from pricing.ts through
 * `packages`; `forWhom` lists kinds of clients, not past clients. No answer
 * promises a place in Google.
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
    thumb: "/services/firmowe.png",
    forWhom: [
      t("Gabinet fizjoterapii, który chce przyjmować zapisy przez formularz.", "A physiotherapy practice that wants to take bookings through a form."),
      t("Firma remontowa, która pokazuje realizacje i zbiera zapytania o wycenę.", "A renovation company that shows its work and collects quote requests."),
      t("Biuro rachunkowe, w którym każda usługa ma własną podstronę.", "An accounting office where every service has its own page."),
    ],
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
    ],
    packages: ["wizytowka", "strona-firmowa"],
    faq: [
      {
        q: t("Wizytówka czy strona firmowa?", "A one-pager or a company website?"),
        a: t(
          "Wizytówka wystarczy, gdy klienci przychodzą z polecenia i chcą Cię tylko sprawdzić. Stronę firmową wybierz, gdy masz kilka usług i każda ma mieć własną podstronę. Wizytówkę można później rozbudować.",
          "A one-pager is enough when clients come by referral and just want to check you out. Choose a company website when you offer several services and each should have its own page. A one-pager can be expanded later.",
        ),
      },
      {
        q: t("Czy sam zmienię treści na stronie?", "Can I edit the content myself?"),
        a: t(
          "W stronie firmowej tak: dostajesz prosty sposób na zmianę tekstów i zdjęć i pokazuję, jak z niego korzystać. W wizytówce zmian jest mało, więc zwykle robię je ja w ramach opieki nad stroną.",
          "With a company website, yes: you get an easy way to change text and photos, and I show you how to use it. A one-pager rarely changes, so I usually make the edits myself as part of the care plan.",
        ),
      },
      {
        q: t("Nie mam tekstów i zdjęć. Co wtedy?", "I don't have copy or photos. What then?"),
        a: t(
          "Pomogę je przygotować. Czas realizacji liczę od chwili, gdy treści są gotowe.",
          "I'll help you prepare them. The timeline starts once the content is ready.",
        ),
      },
      {
        q: t("Kto płaci za domenę i hosting?", "Who pays for the domain and hosting?"),
        a: t(
          "Domena i hosting są po Twojej stronie i na Twoje dane, więc strona należy do Ciebie. Pomogę je wybrać i skonfigurować.",
          "The domain and hosting are yours and in your name, so the website belongs to you. I'll help you choose and set them up.",
        ),
      },
    ],
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
    thumb: "/services/landing.png",
    forWhom: [
      t("Twórca kursu online, który przed premierą zbiera listę oczekujących.", "An online course creator building a waitlist before launch."),
      t("Aplikacja, która przed startem sprawdza zainteresowanie zapisami.", "An app testing interest with sign-ups before it launches."),
      t("Firma szkoleniowa, która promuje jedno wydarzenie z reklam.", "A training company promoting a single event with ads."),
    ],
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
    packages: ["landing-page"],
    faq: [
      {
        q: t("Czym landing page różni się od zwykłej podstrony?", "How is a landing page different from an ordinary page?"),
        a: t(
          "Nie ma menu ani pięciu różnych przycisków, które odciągają od celu. Wszystko na nim prowadzi do jednego działania.",
          "It has no menu and no five different buttons pulling people away from the goal. Everything on it leads to one action.",
        ),
      },
      {
        q: t("Mam dwie kampanie. Jeden landing czy dwa?", "I have two campaigns. One landing page or two?"),
        a: t(
          "Dwa, pod osobnymi adresami. Wtedy w analityce od razu widać, która kampania działa.",
          "Two, at separate addresses. Then analytics shows straight away which campaign works.",
        ),
      },
      {
        q: t("Czy landing może działać pod moją domeną?", "Can the landing page live on my domain?"),
        a: t(
          "Tak: jako podstrona obecnej strony albo pod osobnym adresem w Twojej domenie. Konfigurację biorę na siebie.",
          "Yes: as a page of your current site or at a separate address on your domain. I take care of the setup.",
        ),
      },
      {
        q: t("Kampania startuje w konkretnym dniu. Zdążysz?", "The campaign starts on a set date. Can you make it?"),
        a: t(
          "Napisz o terminie w pierwszej wiadomości. Czas przy pakiecie liczę od otrzymania treści, więc od razu powiem, czy to realne.",
          "Mention the date in your first message. The time shown with the package counts from when I get the content, so I'll tell you right away whether it's realistic.",
        ),
      },
    ],
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
    thumb: "/services/sklep.png",
    forWhom: [
      t("Mała palarnia kawy, która sprzedaje ziarno w subskrypcji.", "A small coffee roastery selling beans on subscription."),
      t("Pracownia ceramiki, która sprzedaje krótkie serie.", "A ceramics studio selling short runs."),
      t("Sklep stacjonarny, który chce sprzedawać też online.", "A bricks-and-mortar shop that wants to sell online too."),
    ],
    includes: [
      {
        title: t("Katalog i koszyk", "Catalogue and cart"),
        text: t(
          "Kategorie, wyszukiwarka i koszyk, z których wygodnie korzysta się na telefonie.",
          "Categories, search and a cart that are comfortable to use on a phone.",
        ),
      },
      {
        title: t("Płatności i wysyłki", "Payments and shipping"),
        text: t(
          "Operatora płatności i metody dostawy wybieramy razem, a konfiguruję je ja. Koszt dostawy klient widzi przed płatnością.",
          "We choose the payment provider and delivery options together, and I set them up. The customer sees the delivery cost before paying.",
        ),
      },
      {
        title: t("Karty produktów pod SEO", "SEO-ready product pages"),
        text: t(
          "Każdy produkt ma własny adres, opis i dane strukturalne.",
          "Every product has its own address, description and structured data.",
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
    packages: ["sklep-internetowy"],
    faq: [
      {
        q: t("Gdzie sklepy najczęściej tracą klientów?", "Where do shops lose most customers?"),
        a: t(
          "Przy kasie: zaskakujący koszt dostawy, za długi formularz, brak wygodnej płatności. Koszt dostawy pokazuję wcześnie, formularz skracam do niezbędnych pól, a płatności testujemy razem przed startem.",
          "At checkout: a surprising delivery cost, a form that's too long, no convenient way to pay. I show the delivery cost early, cut the form down to the fields that matter, and we test payments together before launch.",
        ),
      },
      {
        q: t("Czy poradzę sobie z prowadzeniem sklepu sam?", "Will I manage the shop on my own?"),
        a: t(
          "Tak. Na koniec pokazuję, jak dodać produkt, zmienić cenę i obsłużyć zamówienie. Gdy później czegoś zabraknie, pomogę w ramach opieki nad stroną.",
          "Yes. At the end I show you how to add a product, change a price and handle an order. If something comes up later, I'll help as part of the care plan.",
        ),
      },
      {
        q: t("Czy produkty będą widoczne w Google?", "Will my products show up on Google?"),
        a: t(
          "Każdy produkt ma własny adres, opis i dane strukturalne, więc Google może go znaleźć i zrozumieć. Konkretnej pozycji w wynikach nikt uczciwie nie obieca.",
          "Every product has its own address, description and structured data, so Google can find and understand it. Nobody can honestly promise a specific ranking.",
        ),
      },
    ],
    cta: t("Opisz, co sprzedajesz i ile masz produktów. Odpiszę z planem sklepu i wyceną.", "Tell me what you sell and how many products you have. I'll reply with a plan and a quote."),
  },
  {
    id: "redesign",
    name: t("Redesign"),
    title: t("Redesign strony bez utraty adresów", "Website redesign that keeps your addresses"),
    description: t(
      "Redesign strony {price}. Audyt, nowy projekt i kod oraz przekierowania 301 ze starych adresów: strona jest szybsza, a linki do niej dalej działają.",
      "A website redesign {price}. An audit, new design and code, and 301 redirects from the old addresses: the site gets faster and links to it keep working.",
    ),
    h1: t("Redesign strony, który nie gubi tego, co działa", "A website redesign that keeps what already works"),
    lead: t(
      "Nowy wygląd i szybkość dla strony, która już działa. Zanim cokolwiek zmienię, sprawdzam, co dziś przyprowadza klientów, żeby tego nie zgubić.",
      "A new look and speed for a website that already works. Before I change anything, I check what brings clients in today so none of it gets lost.",
    ),
    thumb: "/services/redesign.png",
    forWhom: [
      t("Biuro rachunkowe ze stroną sprzed lat, która nie działa na telefonie.", "An accounting office with a years-old website that doesn't work on phones."),
      t("Restauracja, której menu wisi w PDF-ie nieczytelnym na telefonie.", "A restaurant whose menu is a PDF nobody can read on a phone."),
      t("Firma, której strona ładuje się kilka sekund i traci klientów z reklam.", "A business whose site takes seconds to load and loses visitors from ads."),
    ],
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
    packages: ["redesign"],
    faq: [
      {
        q: t("Co z pozycjami w Google?", "What happens to my Google rankings?"),
        a: t(
          "Najczęściej giną razem ze starymi adresami. Dlatego spisuję wszystkie adresy starej strony i każdy przekierowuję 301 na jego odpowiednik, tak jak przy przenosinach tej strony. Wyników w Google nie gwarantuję, ale ten krok usuwa najczęstszą przyczynę spadków.",
          "They usually disappear together with the old addresses. So I list every address of the old site and point each one to its counterpart with a 301, as I did when I moved this website. I don't guarantee Google results, but this step removes the most common cause of drops.",
        ),
      },
      {
        q: t("Czy strona przestanie działać na czas prac?", "Will the site go offline while you work?"),
        a: t(
          "Nie. Nową wersję buduję obok, pod osobnym linkiem, a obecna działa do dnia przełączenia.",
          "No. I build the new version alongside it at a separate link, and the current one runs until the day we switch.",
        ),
      },
      {
        q: t("Czy możemy zostawić obecne teksty?", "Can we keep the current copy?"),
        a: t(
          "Tak. Często wystarczy je skrócić i uporządkować. Audyt pokaże, które podstrony przyprowadzają odwiedzających i warto je zostawić.",
          "Yes. Often it's enough to shorten and tidy it. The audit shows which pages bring visitors in and are worth keeping.",
        ),
      },
    ],
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
    thumb: "/projects/obok/icon.png",
    forWhom: [
      t("Marka, która wprowadza produkt i chce, żeby o premierze się mówiło.", "A brand launching a product that wants people to talk about it."),
      t("Studio lub artysta, dla którego strona jest częścią portfolio.", "A studio or artist whose website is part of the portfolio."),
      t("Wydarzenie z własnym światem wizualnym.", "An event with a visual world of its own."),
    ],
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
    proof: {
      project: "obok",
      text: t(
        "Obok to pulpit nad żywym krajobrazem latarni, który zmienia się z prawdziwą pogodą i porą dnia. Projekt, sceny, wideo i kod zrobiłem sam.",
        "Obok is a desktop over a living lighthouse landscape that changes with the real weather and time of day. I made the design, the scenes, the video and the code myself.",
      ),
    },
    packages: ["projekt-specjalny"],
    faq: [
      {
        q: t("Ile kosztuje projekt specjalny?", "How much does a special project cost?"),
        a: t(
          "Powyżej jest cena „od”. Dokładną kwotę podaję po rozmowie, bo zależy od pomysłu: liczby scen, wideo i interakcji.",
          "The “from” price is above. I give the exact amount after a call, because it depends on the idea: the number of scenes, the video and the interactions.",
        ),
      },
      {
        q: t("Czy taka strona nie będzie wolna?", "Won't a site like this be slow?"),
        a: t(
          "Nie musi. Ciężkie elementy ładuję wtedy, gdy są potrzebne, a słabszy telefon dostaje lżejszą wersję. Wyniki pomiarów Obok są w case study.",
          "It doesn't have to be. Heavy parts load when they're needed, and a weaker phone gets a lighter version. Obok's measured results are in the case study.",
        ),
      },
      {
        q: t("Kto przygotuje grafiki i wideo?", "Who makes the graphics and video?"),
        a: t(
          "Ja. Sceny, tekstury i nagrania powstają pod tę jedną stronę, tak jak w Obok.",
          "I do. The scenes, textures and footage are made for this one website, as in Obok.",
        ),
      },
    ],
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
