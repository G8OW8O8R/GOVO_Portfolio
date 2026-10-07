import type { Dictionary } from "./pl";

const en: Dictionary = {
  meta: {
    siteName: "GOVO DIGITAL",
    title: "Piotr Goworek – frontend developer & premium websites | GOVO DIGITAL",
    description:
      "Portfolio of Piotr Goworek (GOVO DIGITAL): fast Next.js websites and apps with motion, WebGL and interactions that leave an impression. See the work and let's talk about yours.",
  },
  pages: {
    about: {
      title: "About – Piotr Goworek | GOVO DIGITAL",
      description: "Who I am, how I work and what I use every day: frontend, motion, integrations and deployment.",
    },
    offer: {
      title: "Services – websites, landing pages, online stores | GOVO DIGITAL",
      description: "Services, process and pricing: websites, landing pages, online stores, redesigns and experience websites.",
    },
    contact: {
      title: "Contact – work with me | GOVO DIGITAL",
      description: "Tell me about your project and I'll reply with a proposal and a quote.",
    },
    cv: {
      title: "CV – Piotr Goworek | GOVO DIGITAL",
      description: "CV of Piotr Goworek, frontend developer: preview and PDF download.",
    },
    project: { titleSuffix: "Project | GOVO DIGITAL" },
  },
  desktop: {
    heading: "Piotr Goworek – frontend developer. Premium websites, motion and interaction.",
    characterAlt: "Black-and-white 3D figure of Piotr Goworek in a black T-shirt with a sparkling OVO pendant",
    filesLabel: "Desktop files",
    homeLabel: "GOVO DIGITAL – home",
    pendantLabel: "OVO pendant – open Contact",
    tidy: "Tidy up",
    tidyLabel: "Tidy up files – restore default places",
    fileHint: "Space: quick look. Alt and arrow keys: move the file.",
    moveHint: "Alt and arrow keys: move the file.",
  },
  quickLook: {
    label: "Quick look",
    open: "Open",
    close: "Close preview",
  },
  window: {
    close: "Close",
    minimize: "Minimise to file",
    fullscreen: "Full screen",
    exitFullscreen: "Exit full screen",
    dragHint: "Drag down to close",
  },
  tabs: {
    about: { about: { id: "about", label: "About me" }, skills: { id: "skills", label: "Skills" } },
    offer: {
      services: { id: "services", label: "Services" },
      process: { id: "process", label: "Process" },
      pricing: { id: "pricing", label: "Pricing" },
    },
  },
  about: { seeCv: "View CV.pdf", stepLabel: "Step" },
  offer: { seePricing: "See pricing", seeProject: "See Obok", time: "Time" },
  contact: {
    emailLabel: "Email",
    write: "Send an email",
    copy: "Copy address",
    copied: "Copied",
    budget: "Budget",
    profiles: "Profiles",
  },
  cv: { download: "Download CV.pdf", openTab: "Open in a new tab", preview: "CV preview" },
  project: {
    sections: ["Challenge", "3 most interesting solutions", "Assets", "Numbers", "What I learned"],
    pending: "Full case study coming soon.",
    cover: "Project cover",
  },
  workWithMe: {
    label: "Work with me",
    availability: "Available for new projects",
  },
  language: { switchTo: "PL", switchLabel: "Wersja polska" },
  files: {
    about: "About me",
    offer: "Services",
    cv: "CV.pdf",
    contact: "Contact",
    projectLabel: "Project",
    badgeNew: "New",
  },
  dock: {
    label: "Contact and profiles",
    linkedin: "LinkedIn",
    github: "GitHub",
    email: "Send an email",
    ask: "Ask me",
  },
  notFound: { title: "No such file", back: "Back to the desktop" },
};

export default en;
