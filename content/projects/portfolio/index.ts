import type { CvEntryInput } from "../schema";

/** This site. Only in the CV (no desktop file, no window); its link is the home page. */
const portfolio: CvEntryInput = {
  slug: "portfolio",
  year: 2026,
  title: { pl: "Portfolio GOVO DIGITAL", en: "GOVO DIGITAL portfolio" },
  cv: {
    summary: {
      pl: "Strona jako pulpit z żywą postacią w WebGL2 – wzrok za kursorem, mruganie, oddech, fizyka łańcucha – okna z treściami, PL/EN, SEO i formularz kontaktowy.",
      en: "A website as a desktop with a living WebGL2 character – eyes following the cursor, blinking, breathing, chain physics – content windows, PL/EN, SEO and a contact form.",
    },
    tags: ["Next.js", "WebGL2", "GLSL", "Motion", "Playwright"],
    last: true,
  },
};

export default portfolio;
