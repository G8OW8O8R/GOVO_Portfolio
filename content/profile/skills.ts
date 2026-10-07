import { skillsSchema } from "./schema";

const t = (pl: string, en = pl) => ({ pl, en });

/**
 * „Umiejętności” tab. PL 1:1 from design/content-skills.md, EN translated.
 * Changing skills is a content change: thumbnails live in public/skills/<id>.png.
 */
export const skills = skillsSchema.parse({
  title: t("Umiejętności", "Skills"),
  lead: t(
    "Na tym pracuję na co dzień – od struktury i kodu po ruch, dane i wdrożenie.",
    "This is what I work with every day – from structure and code to motion, data and deployment.",
  ),
  categories: [
    {
      id: "frontend",
      label: t("Frontend"),
      skills: [
        {
          id: "jezyki-i-struktura",
          name: t("Języki i struktura", "Languages and structure"),
          note: t("czysty, semantyczny kod", "clean, semantic code"),
          tags: [
            t("HTML5"),
            t("CSS3 (Grid, Flexbox, animacje)", "CSS3 (Grid, Flexbox, animations)"),
            t("JavaScript (ES2023)"),
            t("TypeScript"),
          ],
        },
        {
          id: "react-nextjs",
          name: t("React · Next.js"),
          note: t("szybkie strony i aplikacje, SSR i SEO", "fast websites and apps, SSR and SEO"),
          tags: [t("React"), t("Next.js (App Router)"), t("Server Components"), t("SSR/SSG"), t("i18n")],
        },
        {
          id: "style-i-komponenty",
          name: t("Style i komponenty", "Styles and components"),
          note: t("spójny wygląd na każdym ekranie", "a consistent look on every screen"),
          tags: [
            t("Tailwind CSS"),
            t("design tokens"),
            t("responsywność", "responsive design"),
            t("tryb ograniczonego ruchu", "reduced motion"),
          ],
        },
        {
          id: "dostepnosc",
          name: t("Dostępność", "Accessibility"),
          note: t("strona dla każdego", "a website for everyone"),
          tags: [t("WCAG"), t("ARIA"), t("obsługa klawiaturą", "keyboard support"), t("kontrast", "contrast")],
        },
      ],
    },
    {
      id: "motion",
      label: t("Ruch i interakcje", "Motion and interaction"),
      skills: [
        {
          id: "animacje-ui",
          name: t("Animacje UI", "UI animation"),
          note: t("płynne przejścia i mikrointerakcje", "smooth transitions and micro-interactions"),
          tags: [t("Motion"), t("GSAP"), t("View Transitions"), t("fizyka sprężyn", "spring physics")],
        },
        {
          id: "grafika-realtime",
          name: t("Grafika w czasie rzeczywistym", "Real-time graphics"),
          note: t("efekty 3D i shadery", "3D effects and shaders"),
          tags: [t("WebGL2"), t("GLSL"), t("Canvas"), t("Web Audio")],
        },
        {
          id: "scroll-i-wideo",
          name: t("Scroll i wideo", "Scroll and video"),
          note: t("historia opowiadana przewijaniem", "a story told by scrolling"),
          tags: [
            t("animacje przy przewijaniu", "scroll-driven animation"),
            t("sekwencje klatek", "frame sequences"),
            t("wideo w tle (AV1/H.264)", "background video (AV1/H.264)"),
          ],
        },
      ],
    },
    {
      id: "integrations",
      label: t("Integracje i dane", "Integrations and data"),
      skills: [
        {
          id: "api-dane-na-zywo",
          name: t("API i dane na żywo", "APIs and live data"),
          note: t("dane z zewnątrz, które się nie psują", "external data that doesn't break"),
          tags: [
            t("REST"),
            t("WebSocket"),
            t("RSS"),
            t("trasy API w Next.js", "Next.js API routes"),
            t("cache"),
            t("fallbacki", "fallbacks"),
          ],
        },
        {
          id: "walidacja-bezpieczenstwo",
          name: t("Walidacja i bezpieczeństwo", "Validation and security"),
          note: t("dane zawsze w poprawnym kształcie", "data always in the right shape"),
          tags: [
            t("Zod"),
            t("limity zapytań", "rate limiting"),
            t("klucze tylko po stronie serwera", "server-side keys only"),
          ],
        },
        {
          id: "funkcje-ai",
          name: t("Funkcje AI w produkcie", "AI features in the product"),
          note: t("asystent i komendy w języku naturalnym", "an assistant and natural-language commands"),
          tags: [
            t("modele językowe przez API", "language models via API"),
            t("failover dostawców", "provider failover"),
            t("ochrona przed prompt injection", "prompt injection protection"),
          ],
        },
      ],
    },
    {
      id: "design",
      label: t("Design i wdrożenie", "Design and deployment"),
      skills: [
        {
          id: "ux-ui",
          name: t("UX/UI"),
          note: t("makiety, hierarchia, kierunek wizualny", "mockups, hierarchy, visual direction"),
          tags: [t("Figma"), t("makiety", "mockups"), t("art direction")],
        },
        {
          id: "assety-wizualne",
          name: t("Assety wizualne", "Visual assets"),
          note: t("grafika i wideo przygotowane pod web", "graphics and video prepared for the web"),
          tags: [
            t("generowanie obrazu i wideo AI", "AI image and video generation"),
            t("bezszwowe pętle", "seamless loops"),
            t("optymalizacja mediów", "media optimisation"),
          ],
        },
        {
          id: "jakosc-wdrozenie",
          name: t("Jakość i wdrożenie", "Quality and deployment"),
          note: t("szybko, stabilnie, widocznie w Google", "fast, stable, visible on Google"),
          tags: [
            t("Vitest"),
            t("Playwright"),
            t("Lighthouse"),
            t("SEO techniczne", "technical SEO"),
            t("Git/GitHub"),
            t("Vercel"),
          ],
        },
      ],
    },
  ],
  workflow: {
    label: t("Mój workflow", "My workflow"),
    caption: t("Tam, gdzie projekt tego potrzebuje", "Where the project needs it"),
    steps: [
      { id: "workflow-1", title: t("Koncept i makiety", "Concept and mockups") },
      { id: "workflow-2", title: t("Assety AI (obraz → wideo)", "AI assets (image → video)") },
      { id: "workflow-3", title: t("Kod i wdrożenie", "Code and deployment") },
    ],
    note: t(
      "Gdy projekt potrzebuje własnych wizualiów, generuję obraz i wideo AI i obrabiam je pod stronę. Ruch, interakcje i dane zawsze powstają w kodzie.",
      "When a project needs its own visuals, I generate AI images and video and prepare them for the site. Motion, interactions and data are always built in code.",
    ),
  },
});
