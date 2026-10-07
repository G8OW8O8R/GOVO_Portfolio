import Link from "next/link";
import { getDictionary } from "@/content/dictionaries";
import { defaultLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";

// not-found.tsx gets no params; the Polish copy is the default.
export default function NotFound() {
  const dict = getDictionary(defaultLocale);
  return (
    <main className="grid min-h-dvh place-content-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{dict.notFound.title}</h1>
      <Link className="text-ink-muted underline underline-offset-4" href={href(defaultLocale, "home")}>
        {dict.notFound.back}
      </Link>
    </main>
  );
}
