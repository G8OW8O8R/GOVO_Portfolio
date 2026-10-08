import { Download } from "lucide-react";
import { getDictionary } from "@/content/dictionaries";
import { about } from "@/content/profile/about";
import { CvDocument } from "@/components/cv/CvDocument";
import { PrintButton } from "@/components/cv/PrintButton";
import frame from "@/components/cv/cv.module.css";
import type { Locale } from "@/lib/i18n";
import { cvPdfPath, hasCv } from "@/lib/site";
import { PlayOnOpen } from "../motion/PlayOnOpen";

/** Compact actions, the height of the tab pills' bar (one row under the title bar). */
const button = "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-15 font-medium transition";
const primary = `${button} bg-ink text-white hover:bg-[#2a2a2a]`;
const secondary = `${button} bg-surface text-ink shadow-surface hover:shadow-[0_0_0_1px_rgb(17_17_17/0.18),0_1px_2px_rgb(17_17_17/0.04)]`;

/**
 * CV.pdf: the CV as a page (CvDocument) with "Download PDF" (the generated
 * file in the language of the page, only when it exists) and "Print".
 */
export function CvWindow({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const pdf = hasCv(lang) ? cvPdfPath(lang) : null;
  const fileName = `${about.name.replace(/\s+/g, "-")}-CV-${lang.toUpperCase()}.pdf`;
  return (
    <>
      {/* frosted on a layer of its own (::before), like the tab bar: the buttons stay crisp */}
      <div
        role="toolbar"
        aria-label={dict.cv.actions}
        className="sticky top-0 z-10 isolate flex justify-center gap-2 border-b border-win-line px-4 py-2 before:absolute before:inset-0 before:-z-10 before:bg-win/85 before:backdrop-blur-md"
      >
        {pdf && (
          <a href={pdf} download={fileName} className={primary}>
            <Download className="size-4.5" aria-hidden="true" />
            {dict.cv.download}
          </a>
        )}
        <PrintButton label={dict.cv.print} className={secondary} />
      </div>
      <PlayOnOpen className={frame.frame}>
        <CvDocument lang={lang} />
      </PlayOnOpen>
    </>
  );
}
