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
    project: { titleSuffix: "Projekt | GOVO DIGITAL" },
  },
  desktop: {
    heading: "Piotr Goworek – frontend developer. Strony premium, ruch i interakcje.",
    characterAlt: "Czarno-biała figurka 3D Piotra Goworka w czarnej koszulce z błyszczącym wisiorkiem OVO",
    filesLabel: "Pliki na pulpicie",
    homeLabel: "GOVO DIGITAL – strona główna",
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
