import type { ProjectInput } from "../schema";

const dir = "/projects/moonpatch";

type Text = { pl: string; en: string };

/** A photographic plate of the farm (16:9, 1280×720). */
const plate = (id: string, caption: Text, alt: Text) => ({ src: `${dir}/scenes/${id}.jpg`, caption, alt });

/** Case study copy: PL is the source, EN translated. */
const moonpatch: ProjectInput = {
  slug: "moonpatch",
  order: 1,
  year: 2026,
  isNew: true,
  title: { pl: "Moonpatch Farm", en: "Moonpatch Farm" },
  summary: {
    pl: "Jesienna farma dyń, którą zwiedza się jak film – od bramy po sklep ze straszydłami.",
    en: "An autumn pumpkin farm you explore like a film – from the gate to the haunted shop.",
  },
  icon: `${dir}/icon.png`,
  og: `${dir}/og.jpg`,
  cv: {
    summary: {
      pl: "Strona-doświadczenie z własnym silnikiem WebGL2 w Web Workerze: brama otwierana przewijaniem, plac przechodzący w zmierzch, przejścia kamery do trzech wnętrz, produkty na kartach i metkach, koszyk z rezerwacją wizyty i bilet do zapisania. EN/PL, renderowanie na serwerze, 60 fps.",
      en: "An experience site with a custom WebGL2 engine in a Web Worker: a gate opened by scrolling, a square fading into dusk, camera transitions into three interiors, products on recipe cards and tags, a basket with visit booking and a ticket to save. EN/PL, server-rendered, 60 fps.",
    },
    tags: ["Next.js", "TypeScript", "WebGL2", "Web Worker", "Zustand", "Zod"],
  },
  caseStudy: {
    description: {
      pl: "Case study Moonpatch Farm: koncept strony jesiennej farmy dyń na poziomie stron nagradzanych w Awwwards. Brama otwierana przewijaniem, przejścia kamery do kawiarni, stodoły i sklepu ze straszydłami, produkty na kartach przepisów i metkach, koszyk i bilet na farmę.",
      en: "Moonpatch Farm case study: a concept site for an autumn pumpkin farm built to the standard of award-winning sites. A gate opened by scrolling, camera transitions into a café, a barn and a haunted shop, products on recipe cards and tags, a basket and a farm pass.",
    },
    meta: {
      pl: "2026 · koncept · projekt, assety, kod, wdrożenie",
      en: "2026 · concept · design, assets, code, deployment",
    },
    live: { url: "https://moonpatch.vercel.app", label: { pl: "Otwórz Moonpatch", en: "Open Moonpatch" } },
    // Tylko jeśli repozytorium będzie publiczne:
    // code: { url: "https://github.com/…/moonpatch", label: { pl: "Zobacz kod", en: "View the code" } },
    // Wymiary uzupełnić z gotowego pliku showreel.mp4.
    showreel: { src: `${dir}/showreel.mp4`, poster: `${dir}/showreel-poster.jpg`, width: 1920, height: 1080 },
    brief: [
      {
        title: { pl: "Problem", en: "Problem" },
        text: {
          pl: "Strony małych, lokalnych miejsc – farm, kawiarni, sklepów – są do siebie podobne: galeria, cennik, mapka. Chciałem sprawdzić, czy da się oddać klimat miejsca tak, żeby odwiedzający poczuł się, jakby przez nie przechodził.",
          en: "Sites for small local places – farms, cafés, shops – all look alike: a gallery, a price list, a map. I wanted to see whether a site could carry the feel of a place so well that visitors feel they are walking through it.",
        },
      },
      {
        title: { pl: "Rozwiązanie", en: "Solution" },
        text: {
          pl: "Fikcyjna farma dyń opowiedziana jak film: brama, plac o zmierzchu i trzy wnętrza, do których wchodzi się ruchem kamery. Produkty leżą w scenie, a zakupy kończą się biletem na wizytę.",
          en: "A fictional pumpkin farm told like a film: a gate, a square at dusk and three interiors you enter with a camera move. Products sit in the scene, and shopping ends with a ticket for your visit.",
        },
      },
      {
        title: { pl: "Moja rola", en: "My role" },
        text: {
          pl: "Wszystko: koncepcja, kierunek artystyczny, plansze i warstwy, silnik grafiki, frontend, wdrożenie.",
          en: "Everything: concept, art direction, plates and layers, graphics engine, frontend, deployment.",
        },
      },
    ],
    challenge: {
      pl: "Zrobić stronę, która wygląda jak fotografia i rusza się jak kamera, a nie jak animowany szablon: zamiana statycznego zdjęcia na scenę 3D niewidoczna dla oka, cięcia ukryte w rozmyciu ruchu, nic, co „pływa” po zdjęciu. I przy tym szybki start, 60 klatek na sekundę i wygoda na telefonie.",
      en: "Build a site that looks like a photograph and moves like a camera, not like an animated template: a swap from a still photo to a 3D scene the eye can't see, cuts hidden in motion blur, nothing that “floats” over the photo. And still a fast start, 60 frames per second and comfort on a phone.",
    },
    solutions: [
      {
        title: { pl: "Brama otwierana przewijaniem", en: "A gate you open by scrolling" },
        text: {
          pl: "Pierwszy kadr to zwykłe zdjęcie, które ładuje się od razu. Gdy przeglądarka jest gotowa, w jego miejsce wchodzi scena WebGL – co do piksela taka sama. Przewijanie otwiera skrzydła bramy na zawiasach, z cieniem na drodze, a kamera wjeżdża przez łuk na plac.",
          en: "The first frame is a plain photo that loads instantly. When the browser is ready, a WebGL scene takes its place – identical to the pixel. Scrolling swings the gate open on its hinges, with shadows on the road, and the camera drives through the arch into the square.",
        },
        shot: {
          src: `${dir}/shots/gate.jpg`,
          alt: {
            pl: "Drewniana brama farmy z sierpem księżyca na belce, za nią plac z czerwoną stodołą i kawiarnią",
            en: "The wooden farm gate with a crescent moon on the beam, the square with a red barn and a café behind it",
          },
        },
      },
      {
        title: { pl: "Plac, który zapada w zmierzch", en: "A square that falls into dusk" },
        text: {
          pl: "Złota godzina przechodzi w zmierzch, a żarówki girland zapalają się jedna po drugiej – każda w swoim miejscu na zdjęciu. Drogowskaz i tablica ogłoszeń stoją na ziemi razem ze zdjęciem i świecą tym samym światłem.",
          en: "Golden hour turns to dusk and the string lights switch on one by one – each in its own place in the photo. The signpost and the notice board stand on the ground with the photo and catch the same light.",
        },
        shot: {
          src: `${dir}/shots/square.jpg`,
          alt: {
            pl: "Plac farmy o zmierzchu: zapalone girlandy, drogowskaz z nazwami budynków i tablica ogłoszeń",
            en: "The farm square at dusk: lit string lights, a signpost with building names and a notice board",
          },
        },
      },
      {
        title: { pl: "Wejście do wnętrza jak w filmie", en: "Entering a room like in a film" },
        text: {
          pl: "Kamera przyspiesza w stronę drzwi, a cięcie na wnętrze wypada w szczycie rozmycia ruchu, więc oko go nie widzi. Wnętrze wyhamowuje, skrzydła drzwi mijają kamerę. Między pokojami przechodzi się bez wracania na plac, a przycisk wstecz w przeglądarce wraca do tych samych drzwi.",
          en: "The camera speeds toward the door and the cut to the interior lands at the peak of motion blur, so the eye never sees it. The interior settles and the door leaves pass the camera. You move between rooms without going back to the square, and the browser's back button returns you to the same door.",
        },
        shot: {
          src: `${dir}/shots/transition.jpg`,
          alt: {
            pl: "Kadr z przejścia do wnętrza: plac rozmyty ruchem kamery w stronę drzwi",
            en: "A frame from the room transition: the square blurred by the camera moving toward the door",
          },
        },
      },
      {
        title: { pl: "Zakupy na kartach i bilet na wizytę", en: "Shopping on cards and a visit ticket" },
        text: {
          pl: "Produkty otwierają się z miejsca, w którym leżą: w kawiarni jako karty przepisów, w stodole i sklepie jako metki na sznurku. Kawy i ciasta nie da się wysłać, więc rezerwuje się je na wybrany dzień wizyty, a koszyk kończy się biletem, który można zapisać.",
          en: "Products open from where they sit: recipe cards in the café, tags on twine in the barn and the shop. Coffee and pie can't be shipped, so you reserve them for a chosen visit day, and the basket ends with a ticket you can save.",
        },
        shot: {
          src: `${dir}/shots/ticket.jpg`,
          alt: {
            pl: "Bilet Farm Pass z datą wizyty, listą rzeczy czekających w kawiarni i pieczątką księżyca",
            en: "The Farm Pass ticket with the visit date, the items waiting in the café and a moon stamp",
          },
        },
      },
    ],
    assets: {
      text: {
        pl: "Plansze fotograficzne i warstwy przygotowałem sam: kierunek artystyczny, kadry dopasowane do siebie co do piksela, maski żarówek wycięte z różnicy między złotą godziną a zmierzchem, skrzydła drzwi jako osobne warstwy, które składają się z powrotem w zdjęcie bez śladu.",
        en: "I made the photographic plates and layers myself: art direction, frames aligned to the pixel, light-bulb masks cut from the difference between golden hour and dusk, door leaves as separate layers that recombine into the photo without a trace.",
      },
      gallery: [
        plate("gate", { pl: "Brama", en: "Gate" }, { pl: "Brama farmy w złotej godzinie", en: "The farm gate at golden hour" }),
        plate("square-golden", { pl: "Plac", en: "Square" }, { pl: "Plac farmy w złotej godzinie", en: "The farm square at golden hour" }),
        plate("square-dusk", { pl: "Zmierzch", en: "Dusk" }, { pl: "Plac farmy o zmierzchu z zapalonymi girlandami", en: "The farm square at dusk with the string lights on" }),
        plate("cafe", { pl: "Kawiarnia", en: "Café" }, { pl: "Wnętrze kawiarni z ladą i wypiekami", en: "The café interior with the counter and pastries" }),
        plate("barn", { pl: "Stodoła", en: "Barn" }, { pl: "Wnętrze stodoły z kocami, wieńcami i świecami", en: "The barn interior with blankets, wreaths and candles" }),
        plate("haunt", { pl: "Straszydła", en: "Haunt Shop" }, { pl: "Sklep ze straszydłami z maskami i mgłą", en: "The haunted shop with masks and fog" }),
      ],
    },
    stack: ["Next.js", "TypeScript", "WebGL2", "Web Worker", "Tailwind", "Lenis", "Zustand", "Zod", "Vitest", "Playwright", "Vercel"],
    numbers: [
      // Lighthouse 13.5.0, desktop, https://moonpatch.vercel.app/pl, 2026-10-19: 98 / 98 / 98 → median 98
      { value: "98", label: { pl: "Lighthouse wydajność (desktop)", en: "Lighthouse performance (desktop)" } },
      { value: "60 fps", label: { pl: "przejść kamery na typowym laptopie", en: "camera transitions on a typical laptop" } },
      { value: "3", label: { pl: "wnętrza z przejściami kamery", en: "interiors with camera transitions" } },
      { value: "19", label: { pl: "produktów w scenach", en: "products in the scenes" } },
      { value: "2", label: { pl: "języki", en: "languages" } },
      { label: { pl: "własny silnik grafiki bez bibliotek 3D", en: "a custom graphics engine without 3D libraries" } },
    ],
    learned: {
      pl: "Że najwięcej pracy wymaga to, czego ma nie być widać: zamiana zdjęcia na scenę, cięcie między ujęciami, nogi tablicy, które nie mogą się ślizgać po ziemi. I że przy stronie, która ma wyglądać jak film, najważniejsze jest, żeby nadal była szybka i dała się obsłużyć klawiaturą.",
      en: "That the most work goes into what must stay invisible: the swap from photo to scene, the cut between shots, the legs of a notice board that must not slide over the ground. And that a site meant to look like a film still has to be fast and usable with a keyboard.",
    },
    cta: {
      title: { pl: "Chcesz stronę, którą się zwiedza?", en: "Want a site people explore?" },
      button: { pl: "Porozmawiajmy", en: "Let's talk" },
      pricing: { pl: "Projekt specjalny w cenniku", en: "Special project in the pricing" },
    },
  },
};

export default moonpatch;
