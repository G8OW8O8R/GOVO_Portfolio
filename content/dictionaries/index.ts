import type { Locale } from "@/lib/i18n";
import en from "./en";
import pl, { type Dictionary } from "./pl";

const dictionaries: Record<Locale, Dictionary> = { pl, en };

export function getDictionary(lang: Locale): Dictionary {
  return dictionaries[lang];
}

export type { Dictionary };
