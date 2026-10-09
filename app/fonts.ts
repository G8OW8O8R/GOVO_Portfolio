import { JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";

/* Schibsted Grotesk for text, JetBrains Mono for technical details.
   Variable fonts; next/font adjusts the fallback metrics, so the swap doesn't shift the layout.
   Shared by the language layout and the global 404 page (which has no layout). */
const sans = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/** Classes for <html>: the font variables and smoothing. */
export const fontClasses = `${sans.variable} ${mono.variable} antialiased`;
