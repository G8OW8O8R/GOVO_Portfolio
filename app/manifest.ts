import type { MetadataRoute } from "next";
import { getDictionary } from "@/content/dictionaries";
import { defaultLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";

/** Web app manifest: name, the owl-eye icons (pnpm favicon) and the desktop's colours. */
export default function manifest(): MetadataRoute.Manifest {
  const dict = getDictionary(defaultLocale);
  return {
    name: "GOVO DIGITAL – Piotr Goworek",
    short_name: "GOVO",
    description: dict.meta.description,
    lang: defaultLocale,
    start_url: href(defaultLocale, "home"),
    display: "browser",
    background_color: "#e1e0e1",
    theme_color: "#e1e0e1",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
