import type { ProjectInput } from "../schema";

const dir = "/projects/tesorra";

type Text = { pl: string; en: string };

/** A frame of the site (16:9, 1280×720). */
const plate = (id: string, caption: Text, alt: Text) => ({ src: `${dir}/scenes/${id}.jpg`, caption, alt });

/** Case study copy: PL is the source, EN translated. */
const tesorra: ProjectInput = {
  slug: "tesorra",
  order: 1,
  year: 2026,
  isNew: true,
  title: { pl: "Tesorra Racing", en: "Tesorra Racing" },
  summary: {
    pl: "Strona zespołu wyścigowego, przez którą jedzie się torem z pyłu – od driftu po linię startu.",
    en: "A racing team site you drive through on a road of dust – from drift to the starting grid.",
  },
  icon: `${dir}/icon.png`,
  og: `${dir}/og.jpg`,
  cv: {
    summary: {
      pl: "Strona zespołu wyścigowego z własnym silnikiem cząsteczek WebGL2 w Web Workerze i przejazdem kamery po torze z pyłu.",
      en: "A racing team site with a custom WebGL2 particle engine in a Web Worker and a camera ride along a road of dust.",
    },
    tags: ["Next.js", "TypeScript", "WebGL2", "Web Worker", "Zustand", "Zod"],
  },
  caseStudy: {
    description: {
      pl: "Case study Tesorra Racing: koncept strony fikcyjnego zespołu wyścigowego na poziomie stron nagradzanych w Awwwards. Tor z pyłu, przez który przewija się jak przez wyścig, pojazdy z setek tysięcy drobinek, strony kierowców z archiwum kasków i sklep z merchem zakończony przepustką do padoku.",
      en: "Tesorra Racing case study: a concept site for a fictional racing team built to the standard of award-winning sites. A road of dust you scroll through like a race, vehicles made of hundreds of thousands of particles, driver pages with a helmet archive and a merch store that ends with a paddock pass.",
    },
    meta: {
      pl: "2026 · koncept · projekt, assety, kod, wdrożenie",
      en: "2026 · concept · design, assets, code, deployment",
    },
    live: { url: "https://tesorra.vercel.app", label: { pl: "Otwórz Tesorrę", en: "Open Tesorra" } },
    code: { url: "https://github.com/G8OW8O8R/Tesorra", label: { pl: "Zobacz kod", en: "View the code" } },
    showreel: { src: `${dir}/showreel.mp4`, poster: `${dir}/showreel-poster.jpg`, width: 1920, height: 1080 },
    brief: [
      {
        title: { pl: "Problem", en: "Problem" },
        text: {
          pl: "Strony zespołów wyścigowych to zwykle aktualności, kalendarz i sklep w szablonie. Chciałem sprawdzić, czy strona może dać poczucie prędkości i jazdy, zanim ktokolwiek przeczyta pierwsze zdanie.",
          en: "Racing team sites are usually news, a calendar and a store in a template. I wanted to see whether a site could give a sense of speed and driving before anyone reads the first sentence.",
        },
      },
      {
        title: { pl: "Rozwiązanie", en: "Solution" },
        text: {
          pl: "Fikcyjny zespół z trzema dyscyplinami: drift, formuła i motocykle. Strona główna to jeden przejazd po krętym torze z pyłu, z przystankiem przy każdym pojeździe. Wokół tego strony kierowców, archiwum kasków i sklep z merchem.",
          en: "A fictional team with three disciplines: drift, formula and motorcycles. The home page is one ride along a winding road of dust, with a stop at each vehicle. Around it, driver pages, a helmet archive and a merch store.",
        },
      },
      {
        title: { pl: "Moja rola", en: "My role" },
        text: {
          pl: "Wszystko: koncepcja, marka i wordmark, kierunek artystyczny zdjęć i produktów, silnik grafiki, frontend, wdrożenie.",
          en: "Everything: concept, brand and wordmark, art direction for the photos and products, graphics engine, frontend, deployment.",
        },
      },
    ],
    challenge: {
      pl: "Dojść do poziomu najlepszych stron z cząsteczkami: ostry, gęsty pył zamiast mgiełki, płynny przejazd kamery bez szarpnięć przy przewijaniu i pojazdy, które da się rozpoznać, a nie świecące plamy. Do tego zdjęcia ludzi i produktów, które wyglądają jak z prawdziwego reportażu, a nie z generatora.",
      en: "Reach the level of the best particle sites: sharp, dense dust instead of haze, a smooth camera ride with no stutter while scrolling, and vehicles you can recognise rather than glowing blobs. On top of that, photos of people and products that look like real reportage, not like a generator.",
    },
    solutions: [
      {
        title: { pl: "Tor z pyłu prowadzony przewijaniem", en: "A road of dust driven by scrolling" },
        text: {
          pl: "Kamera jedzie po krzywej przez pięć przystanków: drift, formuła, motocykl, sklep i linia startu. Między nimi przyspiesza i przechyla się w zakrętach, przy pojeździe hamuje. Kolor toru, terenu i paska płynnie przechodzi w kolor dyscypliny.",
          en: "The camera rides along a curve through five stops: drift, formula, motorcycle, store and the starting grid. Between them it speeds up and banks into the bends, and it brakes at each vehicle. The colour of the road, the terrain and the bar shifts smoothly into each discipline's colour.",
        },
        shot: {
          src: `${dir}/shots/road.jpg`,
          alt: {
            pl: "Bolid zbudowany z czerwonego pyłu przelatuje nad torem, obok nazwisko kierowczyni Moreau i odbitka zdjęcia",
            en: "A formula car made of red dust flies over the track, next to driver Moreau's name and a photo print",
          },
        },
      },
      {
        title: { pl: "Pojazdy z setek tysięcy drobinek", en: "Vehicles made of hundreds of thousands of particles" },
        text: {
          pl: "Modele 3D zamieniłem na chmury punktów, które silnik zagęszcza na karcie graficznej. Gęsty pył prześwietla się jak światło, a kursor rozpryskuje go jak piasek, który z bezwładnością wraca na miejsce. Całość liczy się w Web Workerze, więc przewijanie zostaje płynne.",
          en: "I turned 3D models into point clouds that the engine densifies on the GPU. Dense dust glows like light, and the cursor scatters it like sand that springs back into place with inertia. It all runs in a Web Worker, so scrolling stays smooth.",
        },
        shot: {
          src: `${dir}/shots/driver.jpg`,
          alt: {
            pl: "Strona kierowcy Kuby Wierzbickiego: portret po przejeździe, ogromny obrysowany numer 21 i nazwisko pionowo",
            en: "Kuba Wierzbicki's driver page: a portrait after a run, a huge outlined number 21 and the surname set vertically",
          },
        },
      },
      {
        title: { pl: "Sklep w tym samym świecie", en: "A store in the same world" },
        text: {
          pl: "Produkty unoszą się w przestrzeni nad pyłem, a zmiana kategorii zmienia kolor sceny. Na stronie napoju wybór smaku przebarwia całe tło. Dla klawiatury i telefonu jest widok listy.",
          en: "Products float in space above the dust, and changing the category changes the colour of the scene. On the drink's page, picking a flavour recolours the whole background. Keyboard and phone users get a list view.",
        },
        shot: {
          src: `${dir}/shots/store.jpg`,
          alt: {
            pl: "Strona napoju Tesorra Energy: puszka w chromowe pazury, wybór smaku i przycisk dodania do koszyka",
            en: "The Tesorra Energy page: a can with chrome claw graphics, a flavour picker and an add-to-basket button",
          },
        },
      },
      {
        title: { pl: "Przepustka do padoku zamiast potwierdzenia", en: "A paddock pass instead of a receipt" },
        text: {
          pl: "Koszyk nazywa się BOX, a dodanie produktu ogłasza komunikat radiowy „Box, box”. Zamówienie testowe kończy się przepustką do padoku z numerem i kodem kreskowym, którą można zapisać. Nic nie jest płatne ani wysyłane.",
          en: "The basket is called BOX, and adding a product triggers a “Box, box” radio call. The test order ends with a paddock pass with a number and a barcode you can save. Nothing is charged or shipped.",
        },
        shot: {
          src: `${dir}/shots/pass.jpg`,
          alt: {
            pl: "Przepustka do padoku z numerem zamówienia, listą produktów i kodem kreskowym",
            en: "The paddock pass with the order number, the list of products and a barcode",
          },
        },
      },
    ],
    assets: {
      text: {
        pl: "Markę i wszystkie obrazy przygotowałem sam: wordmark jako wektor, malowania pojazdów w stylu japońskiego driftu, kierowców z twarzami spójnymi w każdym ujęciu, reportaż z nocnego padoku, kaski z historią każdego malowania i merch wycięty do unoszącego się sklepu.",
        en: "I made the brand and every image myself: the wordmark as a vector, vehicle liveries in the Japanese drift style, drivers whose faces stay consistent in every shot, reportage from a night paddock, helmets with a story behind each paint job, and merch cut out for the floating store.",
      },
      gallery: [
        plate("hero", { pl: "Start", en: "Start" }, { pl: "Wordmark Tesorra na horyzoncie nad torem z pyłu i auto z pyłu", en: "The Tesorra wordmark on the horizon above a road of dust and a car made of dust" }),
        plate("moto", { pl: "Moto", en: "Moto" }, { pl: "Motocykl z niebieskiego pyłu w złożeniu i nazwisko Aranda", en: "A motorcycle of blue dust leaning into a corner and the surname Aranda" }),
        plate("live", { pl: "Start wyścigu", en: "Race start" }, { pl: "Światła startowe z pyłu i odliczanie do następnego wyścigu", en: "Start lights made of dust and a countdown to the next race" }),
        plate("team", { pl: "Zespół", en: "Team" }, { pl: "Trzech kierowców w pionowych pasach ze zdjęciami przy pojazdach", en: "Three drivers in vertical strips with photos by their vehicles" }),
        plate("archive", { pl: "Archiwum kasków", en: "Helmet archive" }, { pl: "Archiwum kasków: karty z malowaniami i kierowca zapinający kask", en: "The helmet archive: cards with paint designs and a driver fastening his helmet" }),
        plate("menu", { pl: "Menu", en: "Menu" }, { pl: "Menu z najbliższą rundą, produktem i zdjęciem z padoku", en: "The menu with the next round, a product and a paddock photo" }),
      ],
    },
    stack: ["Next.js", "TypeScript", "WebGL2", "Web Worker", "Tailwind", "Lenis", "Zustand", "Zod", "Vitest", "Playwright", "Vercel"],
    numbers: [
      // Lighthouse 13.5.0, desktop, https://tesorra.vercel.app/en, 2026-10-26: 3 runs → median 98 (README of the Tesorra repo)
      { value: "98", label: { pl: "Lighthouse wydajność (desktop)", en: "Lighthouse performance (desktop)" } },
      { value: "700k", label: { pl: "drobinek w scenie", en: "particles in the scene" } },
      { value: "60 fps", label: { pl: "przejazdu na typowym laptopie", en: "on a typical laptop" } },
      { value: "5", label: { pl: "przystanków na torze", en: "stops along the road" } },
      { value: "3", label: { pl: "kierowców z archiwum kasków", en: "drivers with a helmet archive" } },
      { value: "16", label: { pl: "produktów w sklepie", en: "products in the store" } },
      { label: { pl: "własny silnik cząsteczek bez bibliotek 3D", en: "a custom particle engine without 3D libraries" } },
    ],
    learned: {
      pl: "Że efekt „wow” nie bierze się z liczby drobinek, tylko z tego, jak są narysowane i jak rusza się kamera. Mniej, ale ostrzej, i jeden wspólny rytm klatek. I że świat z cząsteczek ożywa dopiero wtedy, gdy obok stoją prawdziwi ludzie: zdjęcia kierowców zrobiły dla tej strony tyle samo co silnik.",
      en: "That the “wow” doesn't come from the number of particles but from how they are drawn and how the camera moves. Fewer but sharper, and one shared frame rhythm. And that a world of particles only comes alive when real people stand next to it: the drivers' photos did as much for this site as the engine.",
    },
    cta: {
      title: { pl: "Chcesz stronę, która ma prędkość?", en: "Want a site with speed?" },
      button: { pl: "Porozmawiajmy", en: "Let's talk" },
      pricing: { pl: "Projekt specjalny w cenniku", en: "Special project in the pricing" },
    },
  },
};

export default tesorra;
