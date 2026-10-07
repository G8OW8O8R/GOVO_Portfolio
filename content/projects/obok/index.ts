import type { ProjectInput } from "../schema";

const obok: ProjectInput = {
  slug: "obok",
  order: 1,
  isNew: true,
  title: { pl: "Obok", en: "Obok" },
  // Draft – final copy comes with the case study (task 4).
  summary: {
    pl: "Strona z doświadczeniem: wideo, ruch i interakcje.",
    en: "An experience website: video, motion and interactions.",
  },
  icon: "/projects/obok/icon.png",
};

export default obok;
