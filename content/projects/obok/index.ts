import type { ProjectInput } from "../schema";

const dir = "/projects/obok";

type Text = { pl: string; en: string };

/** A weather scene poster (scripts/build-obok-media.ts copies them from the Obok repo). */
const scene = (id: string, caption: Text, when: Text) => ({
  src: `${dir}/scenes/${id}.jpg`,
  caption,
  alt: { pl: `Scena Obok: latarnia ${when.pl}`, en: `Obok scene: the lighthouse ${when.en}` },
});

/** Case study copy 1:1 from design/content-obok.md (PL); EN translated. */
const obok: ProjectInput = {
  slug: "obok",
  order: 1,
  year: 2026,
  isNew: true,
  title: { pl: "Obok", en: "Obok" },
  summary: {
    pl: "Pulpit, który żyje razem z pogodą za oknem.",
    en: "A desktop that lives with the weather outside your window.",
  },
  icon: `${dir}/icon.png`,
  og: `${dir}/og.jpg`,
  // design/content-cv.md
  cv: {
    summary: {
      pl: "Interaktywny pulpit z żywym światem zależnym od prawdziwej pogody. Dane na żywo z kilku API (pogoda, kursy walut i kryptowalut, wiadomości, muzyka) z cache i zapasowymi źródłami, aplikacje w oknach, Spotlight z szybkimi poleceniami, wideo i ruch dopracowane pod 60 fps.",
      en: "An interactive desktop with a living world driven by the real weather. Live data from several APIs (weather, currency and crypto rates, news, music) with caching and fallback sources, apps in windows, Spotlight with quick commands, video and motion tuned for 60 fps.",
    },
    tags: ["Next.js", "TypeScript", "WebGL", "REST", "Zod", "Vercel"],
  },
  caseStudy: {
    description: {
      pl: "Case study Obok: pulpit w stylu systemu operacyjnego nad żywym krajobrazem latarni, który zmienia się z prawdziwą pogodą i porą dnia. Pogoda, przypomnienia, zakupy, rynki, wiadomości i muzyka jako aplikacje w oknach.",
      en: "Obok case study: an OS-style desktop over a living lighthouse landscape that changes with the real weather and time of day. Weather, reminders, shopping, markets, news and music as apps in windows.",
    },
    meta: {
      pl: "2026 · projekt własny · projekt, assety, kod, wdrożenie",
      en: "2026 · personal project · design, assets, code, deployment",
    },
    live: { url: "https://oh-bok.vercel.app", label: { pl: "Otwórz Obok", en: "Open Obok" } },
    code: { url: "https://github.com/G8OW8O8R/OH-bok", label: { pl: "Zobacz kod", en: "View the code" } },
    showreel: { src: `${dir}/showreel.mp4`, poster: `${dir}/showreel-poster.jpg`, width: 1920, height: 950 },
    brief: [
      {
        title: { pl: "Problem", en: "Problem" },
        text: {
          pl: "Strony z pogodą i „dashboardy” wyglądają tak samo – tabelki i ikonki. Chciałem sprawdzić, czy codzienne informacje mogą być doświadczeniem, a nie listą.",
          en: "Weather sites and dashboards all look the same: tables and icons. I wanted to see whether everyday information could be an experience rather than a list.",
        },
      },
      {
        title: { pl: "Rozwiązanie", en: "Solution" },
        text: {
          pl: "Pulpit w stylu systemu operacyjnego nad żywym krajobrazem latarni, który zmienia się z prawdziwą pogodą i porą dnia. Codzienne rzeczy – pogoda, przypomnienia, zakupy, rynki, wiadomości, muzyka – jako aplikacje w oknach.",
          en: "An OS-style desktop over a living lighthouse landscape that changes with the real weather and time of day. Everyday things – weather, reminders, shopping, markets, news, music – as apps in windows.",
        },
      },
      {
        title: { pl: "Moja rola", en: "My role" },
        text: {
          pl: "Wszystko: koncepcja, makiety, assety wizualne, frontend, integracje, wdrożenie.",
          en: "Everything: concept, mockups, visual assets, frontend, integrations, deployment.",
        },
      },
    ],
    challenge: {
      pl: "Zrobić stronę, która wygląda jak scena z filmu, a jednocześnie działa jak narzędzie: ładuje się szybko, nie zawiesza się, gdy któreś API nie odpowie, i jest wygodna na telefonie. Każdy efekt musiał mieć powód i zmieścić się w 60 klatkach na sekundę.",
      en: "Build a site that looks like a scene from a film and still works like a tool: it loads fast, doesn't hang when an API stops answering and is comfortable on a phone. Every effect needed a reason and had to fit in 60 frames per second.",
    },
    solutions: [
      {
        title: { pl: "Świat zależny od pogody", en: "A world driven by the weather" },
        text: {
          pl: "Pięć scen (słońce, chmury, deszcz, pogodna noc, pochmurna noc) jako zapętlone wideo, dobierane według prawdziwej pogody i pory dnia w lokalizacji użytkownika. Przejścia między scenami bez przeskoku, poster jako pierwszy kadr, żeby nic nie migało przy ładowaniu.",
          en: "Five scenes (sun, clouds, rain, clear night, cloudy night) as looping video, picked by the real weather and time of day where the user is. Scenes change without a jump, and a poster is the first frame so nothing flickers while loading.",
        },
        shot: {
          src: `${dir}/shots/weather.jpg`,
          alt: {
            pl: "Pulpit Obok nad latarnią w pochmurny wieczór: pogoda, lista zakupów, przypomnienia i wiadomości",
            en: "The Obok desktop over the lighthouse on a cloudy evening: weather, shopping list, reminders and news",
          },
        },
      },
      {
        title: { pl: "Dane na żywo, które się nie psują", en: "Live data that doesn't break" },
        text: {
          pl: "Pogoda, kursy walut i kryptowalut, wiadomości i muzyka z kilku publicznych API. Każde źródło ma cache i zapasowego dostawcę, a dane są walidowane, zanim trafią do interfejsu. Gdy coś nie odpowie, okno pokazuje ostatnie dane zamiast błędu.",
          en: "Weather, currency and crypto rates, news and music from several public APIs. Every source has a cache and a fallback provider, and the data is validated before it reaches the interface. When something doesn't answer, the window shows the last data instead of an error.",
        },
        shot: {
          src: `${dir}/shots/live-data.jpg`,
          alt: {
            pl: "Okno Rynki: kursy kryptowalut w złotych, wykres Bitcoina z 24 godzin i alerty cenowe",
            en: "The Markets window: crypto prices in złoty, a 24-hour Bitcoin chart and price alerts",
          },
        },
      },
      {
        title: { pl: "Aplikacje w oknach", en: "Apps in windows" },
        text: {
          pl: "Okna jak w systemie: otwieranie, przenoszenie, kolejność, skróty klawiszowe, a na telefonie arkusze od dołu. Przypomnienia z kalendarzem, lista zakupów, rynki z wykresem i alertami cenowymi, wiadomości z podziałem Polska/Świat.",
          en: "Windows like in an operating system: opening, moving, stacking order, keyboard shortcuts, and bottom sheets on a phone. Reminders with a calendar, a shopping list, markets with a chart and price alerts, news split into Poland and World.",
        },
        shot: {
          src: `${dir}/shots/windows.jpg`,
          alt: {
            pl: "Okno Przypomnienia z kalendarzem, wyborem godziny i szybkimi terminami",
            en: "The Reminders window with a calendar, a time picker and quick presets",
          },
        },
      },
      {
        title: { pl: "Spotlight z szybkimi poleceniami", en: "Spotlight with quick commands" },
        text: {
          pl: "Jedno pole, w którym wpisujesz „dodaj mleko i jajka do listy” albo „przypomnij jutro o 8 o dentyście”, a Obok zamienia to na akcję w odpowiedniej aplikacji.",
          en: "One field where you type “add milk and eggs to the list” or “remind me about the dentist tomorrow at 8”, and Obok turns it into an action in the right app.",
        },
        shot: {
          src: `${dir}/shots/spotlight.jpg`,
          alt: {
            pl: "Spotlight z poleceniem „dodaj mleko i jajka do listy zakupów” i podpowiedzią „Dodaj do listy”",
            en: "Spotlight with the command “add milk and eggs to the shopping list” and the suggestion “Add to list”",
          },
        },
      },
    ],
    assets: {
      text: {
        pl: "Krajobrazy i animacje sceny przygotowałem sam: najpierw kadr, potem animacja, potem obróbka pod web – bezszwowe pętle, poster z pierwszej klatki, kompresja pod szybkie ładowanie. Jeden kadr bazowy dla wszystkich warstw, żeby sceny pasowały do siebie co do piksela.",
        en: "I made the landscapes and scene animations myself: first the frame, then the animation, then the web pass – seamless loops, a poster from the first frame, compression for fast loading. One base frame for every layer, so the scenes match to the pixel.",
      },
      gallery: [
        scene("sunny", { pl: "Słońce", en: "Sun" }, { pl: "w słoneczny dzień", en: "on a sunny day" }),
        scene("cloudy", { pl: "Chmury", en: "Clouds" }, { pl: "w pochmurny dzień", en: "on a cloudy day" }),
        scene("rain", { pl: "Deszcz", en: "Rain" }, { pl: "w deszczu", en: "in the rain" }),
        scene("night-clear", { pl: "Pogodna noc", en: "Clear night" }, { pl: "pogodną nocą", en: "on a clear night" }),
        scene("night-cloudy", { pl: "Pochmurna noc", en: "Cloudy night" }, { pl: "pochmurną nocą", en: "on a cloudy night" }),
      ],
    },
    stack: ["Next.js", "TypeScript", "Tailwind", "Motion", "Zustand", "Zod", "REST", "Vitest", "Playwright", "Vercel"],
    numbers: [
      // Lighthouse 12.8.2, desktop, https://oh-bok.vercel.app, 2026-10-08: 91 / 95 / 95 → median 95
      { value: "95", label: { pl: "Lighthouse wydajność (desktop)", en: "Lighthouse performance (desktop)" } },
      { value: "5", label: { pl: "scen pogodowych", en: "weather scenes" } },
      { value: "6", label: { pl: "aplikacji", en: "apps" } },
      {
        label: {
          pl: "kilka źródeł danych na żywo z zapasowymi dostawcami",
          en: "several live data sources with fallback providers",
        },
      },
      { value: "60 fps", label: { pl: "animacji interfejsu na typowym laptopie", en: "interface animation on a typical laptop" } },
    ],
    learned: {
      pl: "Że „wow” robi się w szczegółach, których nikt nie zauważa, dopóki ich nie zabraknie: poster, który nie miga, okno, które nie znika przy błędzie API, pętla bez przeskoku. I że najtrudniejsze w efektownej stronie jest to, żeby nadal była szybka.",
      en: "That “wow” lives in details nobody notices until they're missing: a poster that doesn't flicker, a window that doesn't vanish on an API error, a loop without a jump. And that the hardest part of a striking site is keeping it fast.",
    },
    cta: {
      title: { pl: "Chcesz taką stronę dla swojej marki?", en: "Want a site like this for your brand?" },
      button: { pl: "Porozmawiajmy", en: "Let's talk" },
      pricing: { pl: "Projekt specjalny w cenniku", en: "Special project in the pricing" },
    },
  },
};

export default obok;
