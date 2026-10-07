const pl = {
  meta: {
    siteName: "GOVO DIGITAL",
    title: "Piotr Goworek – frontend developer i strony premium | GOVO DIGITAL",
    description:
      "Portfolio Piotra Goworka (GOVO DIGITAL): szybkie strony i aplikacje w Next.js, ruch, WebGL i interakcje, które robią wrażenie. Zobacz projekty i porozmawiajmy o Twoim.",
  },
  pages: {
    about: {
      title: "O mnie – Piotr Goworek | GOVO DIGITAL",
      description: "Kim jestem, jak pracuję i czego używam na co dzień: frontend, ruch, integracje i wdrożenia.",
    },
    offer: {
      title: "Oferta – strony internetowe, landing page, sklepy | GOVO DIGITAL",
      description: "Usługi, proces i cennik: strony internetowe, landing page, sklepy, redesign i strony z doświadczeniem.",
    },
    contact: {
      title: "Kontakt – współpracujmy | GOVO DIGITAL",
      description: "Opisz projekt, a odpiszę z propozycją i wyceną.",
    },
    cv: {
      title: "CV – Piotr Goworek | GOVO DIGITAL",
      description: "CV Piotra Goworka, frontend developera: podgląd i pobranie PDF.",
    },
    project: { titleSuffix: "Projekt | GOVO DIGITAL" },
  },
  desktop: {
    heading: "Piotr Goworek – frontend developer. Strony premium, ruch i interakcje.",
    characterAlt: "Czarno-biała figurka 3D Piotra Goworka w czarnej koszulce z błyszczącym wisiorkiem OVO",
    filesLabel: "Pliki na pulpicie",
    homeLabel: "GOVO DIGITAL – strona główna",
    pendantLabel: "Wisiorek OVO – otwórz Kontakt",
    tidy: "Uporządkuj",
    tidyLabel: "Uporządkuj pliki – przywróć domyślne miejsca",
    fileHint: "Spacja: szybki podgląd. Alt i strzałki: przesuń plik.",
    moveHint: "Alt i strzałki: przesuń plik.",
  },
  quickLook: {
    label: "Szybki podgląd",
    open: "Otwórz",
    close: "Zamknij podgląd",
  },
  window: {
    close: "Zamknij",
    minimize: "Minimalizuj do pliku",
    fullscreen: "Pełny ekran",
    exitFullscreen: "Zakończ pełny ekran",
    dragHint: "Przeciągnij w dół, aby zamknąć",
  },
  tabs: {
    about: { about: { id: "o-mnie", label: "O mnie" }, skills: { id: "umiejetnosci", label: "Umiejętności" } },
    offer: {
      services: { id: "uslugi", label: "Usługi" },
      process: { id: "proces", label: "Proces" },
      pricing: { id: "cennik", label: "Cennik" },
    },
  },
  about: { seeCv: "Zobacz CV.pdf", stepLabel: "Krok" },
  offer: { seePricing: "Zobacz cennik", seeProject: "Zobacz Obok", time: "Czas" },
  contact: {
    emailLabel: "E-mail",
    write: "Napisz e-mail",
    copy: "Kopiuj adres",
    copied: "Skopiowano",
    budget: "Budżet",
    profiles: "Profile",
  },
  cv: { download: "Pobierz CV.pdf", openTab: "Otwórz w nowej karcie", preview: "Podgląd CV" },
  project: {
    sections: ["Wyzwanie", "3 najciekawsze rozwiązania", "Assety", "Liczby", "Czego się nauczyłem"],
    pending: "Pełne case study w przygotowaniu.",
    cover: "Okładka projektu",
  },
  workWithMe: {
    label: "Współpracujmy",
    availability: "Dostępny do nowych projektów",
  },
  language: { switchTo: "EN", switchLabel: "English version" },
  files: {
    about: "O mnie",
    offer: "Oferta",
    cv: "CV.pdf",
    contact: "Kontakt",
    projectLabel: "Projekt",
    badgeNew: "Nowy",
  },
  dock: {
    label: "Kontakt i profile",
    linkedin: "LinkedIn",
    github: "GitHub",
    email: "Napisz e-mail",
    ask: "Zapytaj mnie",
  },
  notFound: { title: "Nie ma takiego pliku", back: "Wróć na pulpit" },
};

export type Dictionary = typeof pl;
export default pl;
