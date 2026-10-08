import { cvSchema } from "./schema";

const t = (pl: string, en = pl) => ({ pl, en });

/**
 * CV (window "CV.pdf", /pl/cv, /en/cv and the generated PDFs). PL is the
 * source copy, EN translated. Name, role, e-mail, links, skills and
 * the site address are not here: they come from about.ts, contact.ts, links.ts
 * and skills.ts. Projects come from content/projects (field `cv`).
 * After a change: build locally (scripts/build-cv.ts) and commit public/cv/CV-*.pdf.
 */
export const cv = cvSchema.parse({
  available: t("Dostępny od zaraz", "Available now"),
  location: t("Warszawa i okolice · zdalnie lub hybrydowo", "Warsaw area · remote or hybrid"),
  photo: "/cv/photo.jpg",
  profile: t(
    "Frontend developer szukający pierwszego etatu w zespole produktowym. Projektuję interfejsy i sam je koduję – od makiety po wdrożenie – w React, Next.js i TypeScript. Najbardziej lubię miejsce, w którym design spotyka się z techniką: ruch, grafikę w czasie rzeczywistym i dane na żywo. Dbam o wydajność, dostępność i SEO, a w zespole chcę rozwijać się dalej obok bardziej doświadczonych osób.",
    "Frontend developer looking for a first full-time role in a product team. I design interfaces and code them myself – from mockup to deployment – in React, Next.js and TypeScript. What I enjoy most is where design meets engineering: motion, real-time graphics and live data. I care about performance, accessibility and SEO, and I want to keep growing in a team alongside more experienced people.",
  ),
  headings: {
    projects: t("Projekty", "Projects"),
    other: t("Pozostałe doświadczenie", "Other experience"),
    skills: t("Umiejętności", "Skills"),
    certificates: t("Certyfikaty", "Certificates"),
    education: t("Wykształcenie", "Education"),
    languages: t("Języki", "Languages"),
    extra: t("Inne", "Other"),
  },
  projectsContext: t("GOVO DIGITAL, marka własna · 2025 – obecnie", "GOVO DIGITAL, own brand · 2025 – present"),
  other: [
    {
      role: t("Magazynier", "Warehouse operative"),
      place: "AutoPartner S.A., Pruszków",
      period: t("07.2025 – obecnie", "07.2025 – present"),
      note: t("kompletacja zwrotów, dostawy, organizacja magazynu", "processing returns, deliveries, warehouse organisation"),
    },
    {
      role: t("Specjalista obsługi klienta", "Customer service specialist"),
      place: "BP, Brwinów",
      period: t("04.2025 – 07.2025"),
      note: t("obsługa klientów i sprzedaż", "customer service and sales"),
    },
    {
      role: t("Pracownik restauracji", "Restaurant crew member"),
      place: "McDonald's Polska",
      period: t("05.2024 – 07.2024"),
      note: t("praca zespołowa w szybkim tempie", "teamwork at a fast pace"),
    },
  ],
  certificates: [
    { name: t("Responsive Web Design"), issuer: "freeCodeCamp", year: 2026 },
    { name: t("SEO Essentials"), issuer: "Semrush", year: 2026 },
    { name: t("Angielski C2 – czytanie i słuchanie", "English C2 – reading and listening"), issuer: "EF SET 73/100", year: 2026 },
  ],
  education: [
    {
      school: t("Liceum Ogólnokształcące im. Jarosława Iwaszkiewicza", "Jarosław Iwaszkiewicz General Secondary School"),
      years: "2020–2024",
    },
  ],
  languages: [
    t("polski (ojczysty)", "Polish (native)"),
    t(
      "angielski: B2/C1 w komunikacji, C2 w czytaniu i słuchaniu",
      "English: B2/C1 in communication, C2 in reading and listening",
    ),
    t("niemiecki A2", "German A2"),
  ],
  extra: [t("prawo jazdy kat. B", "driving licence, category B")],
  footer: {
    interactive: t("Interaktywna wersja:", "Interactive version:"),
    consentPl:
      "Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z RODO.",
  },
});
