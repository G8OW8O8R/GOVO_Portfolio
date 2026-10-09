import { Fragment } from "react";
import { getDictionary } from "@/content/dictionaries";
import { privacy } from "@/content/profile/privacy";
import { EmailLink, EmailText } from "@/components/ui/Email";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { ui } from "./ui";

/** Privacy: the lead, then one surface of short rows (heading beside the text on wide windows). */
export function PrivacyWindow({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const updated = new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(privacy.updated),
  );

  return (
    <div className={ui.page}>
      <header className="text-center">
        <h2 className={ui.display}>{dict.files.privacy}</h2>
        <p className={`${ui.introText} max-w-[52ch]`}>{privacy.lead[lang]}</p>
      </header>

      <dl className={`${ui.surface} mx-auto mt-8 max-w-[720px] divide-y divide-win-line px-5 desk:px-8`}>
        {privacy.rows.map((row) => (
          <div key={row.id} className="py-5 desk:grid desk:grid-cols-[150px_minmax(0,1fr)] desk:gap-8">
            <dt className={ui.label}>{row.title[lang]}</dt>
            <dd className={`mt-1.5 text-pretty desk:mt-0 ${ui.small}`}>
              {row.text[lang].split("{email}").map((part, i) => (
                <Fragment key={i}>
                  {i > 0 && (
                    <EmailLink fallbackHref={href(lang, "contact")} className={ui.link}>
                      <EmailText />
                    </EmailLink>
                  )}
                  {part}
                </Fragment>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <p className={`${ui.mono} mt-6 text-center`}>{dict.privacy.updated.replace("{date}", updated)}</p>
    </div>
  );
}
