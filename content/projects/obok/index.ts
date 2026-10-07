import type { ProjectInput } from "../schema";

const obok: ProjectInput = {
  slug: "obok",
  order: 1,
  isNew: true,
  title: { pl: "Obok", en: "Obok" },
  // Draft – final copy comes with the case study (task 4).
  summary: {
    pl: "Obok – strona z doświadczeniem: wideo, ruch i interakcje oraz asystent AI.",
    en: "Obok – an experience website: video, motion and interactions, plus an AI assistant.",
  },
  icon: "/projects/obok/icon.png",
};

export default obok;
