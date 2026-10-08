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
  about: { seeCv: "View CV.pdf" },
  offer: { seeProject: "See Obok", time: "Timeline" },
  contact: {
    lead: "Write a few sentences about your project or the role. I usually reply within a day.",
    name: "Name",
    email: "Email",
    subject: "What is it about",
    budget: "Budget",
    optional: "optional",
    message: "Message",
    messageHint: {
      strona: "What the website should do, when you need it and whether you have the copy yet.",
      praca: "The role, the type of contract and a link to the job ad, if there is one.",
      inne: "How can I help?",
    },
    honeypot: "Leave this field empty",
    send: "Send message",
    sending: "Sending…",
    errors: {
      required: "Please fill in this field.",
      emailInvalid: "Please check the email address.",
      subjectInvalid: "Choose what the message is about.",
      nameShort: "The name needs at least 2 characters.",
      messageShort: "Write at least one full sentence (10+ characters).",
      tooLong: "Too long – please shorten it.",
    },
    sentTitle: "Thanks! I usually reply within a day.",
    sentText: "Your message arrived. The reply will go to the email address you gave.",
    sendAnother: "Send another message",
    failed: "The message couldn't be sent. Try again or write an email.",
    retry: "Try again",
    limited: "A few messages were already sent from this address. Try again in {min} min or write an email.",
    unavailable: "The form isn't working right now. Your message is ready in an email:",
    openEmail: "Open the email with your message",
    preferEmail: "Prefer email?",
    copy: "Copy",
    copied: "Copied",
  },
  cv: { download: "Download PDF", print: "Print", actions: "Download or print the CV" },
  project: {
    cover: "Project cover",
  },
  workWithMe: {
    label: "Work with me",
    availability: "Available for new projects",
  },
  language: { switchTo: "PL", switchLabel: "Wersja polska" },
  cursor: { open: "Open", play: "Play", pause: "Pause" },
  video: { play: "Play preview", pause: "Pause preview" },
  live: { live: "live" },
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
